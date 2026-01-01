import Project from "../model/Project.js";
import Reviewer from '../model/Reviewer.js';
import User from '../model/User.js';
import nodemailer from 'nodemailer';
import { cloudinary } from '../config/cloudinary.js';
export const createProject = async (req, res) => {
  try {
    const { title, summary } = req.body

    // debug logging to inspect uploaded file and auth during submission
    console.log('--- createProject called ---')
    console.log('AUTH HEADER:', req.headers.authorization)
    console.log('REQ.USER:', req.user)
    console.log('REQ.FILE:', req.file)

    if (!title || !summary) {
      return res.status(400).json({ message: 'Title and summary are required' })
    }

    // enforce uploaded document is provided
    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required' })
    }

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const project = await Project.create({
      title,
      summary,
      // multer / cloudinary may set different properties depending on storage plugin
      document: req.file ? (req.file.path || req.file.secure_url || req.file.url || req.file.location || "") : "",
      public_id: req.file ? (req.file.public_id || req.file.filename || req.file.originalname || "") : "",
      submittedBy: user._id,
      client: user.company || 'Individual',
      clientEmail: user.email,
      assignedReviewers: user.assignedReviewers || [],
    })

    const populated = await Project.findById(project._id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('assignedReviewers')

    res.status(201).json(populated)
  } catch (error) {
    console.error('createProject error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}




export const getAllProjects = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    // If assignedTo is present, filter projects where assignedReviewers includes that id
    if (assignedTo) {
      let reviewerId = assignedTo;
      // support the 'me' keyword when auth middleware sets req.user
      if (assignedTo === 'me') {
        if (!req.user || !req.user.userId) {
          return res.status(400).json({ message: 'Unable to resolve current user for assignedTo=me' });
        }
        reviewerId = req.user.userId;
      }
      const projects = await Project.find({ assignedReviewers: reviewerId }).populate('assignedReviewers').populate('submittedBy', 'firstName lastName email');
      return res.status(200).json(projects);
    }

    const projects = await Project.find().populate('assignedReviewers').populate('submittedBy', 'firstName lastName email');
    res.status(200).json(projects);
    } catch (error) {
    console.error('Error in getAllProjects:', error);
    res.status(500).json({ message: 'Server error' });
    }
}
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('assignedReviewers').populate('submittedBy', 'firstName lastName email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}

export const getReviews = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('reviews');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(project.reviews || []);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const addReview = async (req, res) => {
  try {
    let { comment, reviewerId, reviewerName } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ message: 'Comment is required' });

    // If reviewerId was provided, try to resolve the reviewer's name from DB for integrity
    if (reviewerId) {
      try {
        const r = await Reviewer.findById(reviewerId);
        if (r) {
          reviewerName = `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email || reviewerName;
        }
      } catch (e) {
        // ignore lookup failures and fall back to provided reviewerName
      }
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const review = { reviewerId: reviewerId || null, reviewerName: reviewerName || 'Reviewer', comment };
    project.reviews = project.reviews || [];
    project.reviews.push(review);
    await project.save();
    res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Assign a reviewer to a project
export const assignReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.body;
    if (!reviewerId) return res.status(400).json({ message: 'reviewerId is required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.assignedReviewers = project.assignedReviewers || [];
    // avoid duplicates
    if (!project.assignedReviewers.find(r => String(r) === String(reviewerId))) {
      project.assignedReviewers.push(reviewerId);
      await project.save();
    }
    const populated = await Project.findById(project._id).populate('assignedReviewers').populate('submittedBy','firstName lastName email');
    res.status(200).json(populated);
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Unassign a reviewer from a project
export const unassignReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.body;
    if (!reviewerId) return res.status(400).json({ message: 'reviewerId is required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.assignedReviewers = (project.assignedReviewers || []).filter(r => String(r) !== String(reviewerId));
    await project.save();
    const populated = await Project.findById(project._id).populate('assignedReviewers').populate('submittedBy','firstName lastName email');
    res.status(200).json(populated);
  } catch (error) {
    console.error('Error unassigning reviewer:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Make a decision on a project (accept / reject)
export const decideProject = async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision || !['accept','reject'].includes(decision)) return res.status(400).json({ message: 'decision must be accept or reject' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Prevent deciding a project if there are no assigned reviewers and no reviews/comments
    if ((!(project.assignedReviewers && project.assignedReviewers.length > 0)) && (!(project.reviews && project.reviews.length > 0))) {
      return res.status(400).json({ message: 'Cannot accept or reject project without an assigned reviewer or at least one review/comment' });
    }

    project.status = decision === 'accept' ? 'accepted' : 'rejected';
    await project.save();

    // re-load project populated so we have submitter email if available
    const populated = await Project.findById(project._id).populate('submittedBy', 'firstName lastName email').populate('assignedReviewers');

    // Notify submitter via email if we can resolve an address
    let recipientEmail = populated.clientEmail || null;
    if (!recipientEmail && populated.submittedBy && populated.submittedBy.email) {
      recipientEmail = populated.submittedBy.email;
    }

    let emailSent = false;
    let emailError = null;
    if (recipientEmail && process.env.USER_EMAIL && process.env.PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.USER_EMAIL, pass: process.env.PASSWORD }
        });
        const subject = `Your project "${populated.title}" has been ${populated.status}`;
        const frontend = process.env.FRONTEND_URL || 'https://rtdp.netlify.app';
        const projectUrl = `${frontend}/projects/${populated._id}`;
        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Your project has been ${populated.status}</h2>
            <p><strong>${populated.title}</strong></p>
            <p>${populated.summary}</p>
            <p>Status: <strong>${populated.status}</strong></p>
            <p><a href="${projectUrl}">View project</a></p>
            <p>Thanks,<br/>The Review Team</p>
          </div>
        `;
        const text = `Hello,\n\nYour project "${populated.title}" has been ${populated.status}.\n\nView: ${projectUrl}\n\nThank you,\nThe Review Team`;
        await transporter.sendMail({ from: process.env.USER_EMAIL, to: recipientEmail, subject, text, html });
        emailSent = true;
      } catch (e) {
        console.error('Failed to send decision email:', e);
        emailError = e?.message || 'Failed to send email';
      }
    } else if (!recipientEmail) {
      emailError = 'No recipient email available';
    }

    // return populated project and email info
    res.status(200).json({ ...populated.toObject(), emailSent, emailError });
  } catch (error) {
    console.error('Error deciding project:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Allow admins to manually notify an email address about a project
export const notifyProject = async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !String(email).includes('@')) return res.status(400).json({ message: 'Valid email is required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let emailSent = false;
    let emailError = null;
    if (process.env.USER_EMAIL && process.env.PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.USER_EMAIL, pass: process.env.PASSWORD }
        });
        const subject = `Notification regarding your project "${project.title}"`;
        const frontend = process.env.FRONTEND_URL || 'https://rtdp.netlify.app'
        const projectUrl = `${frontend}/projects/${project._id}`;
        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Message regarding your project</h2>
            <p><strong>${project.title}</strong></p>
            <p>${project.summary}</p>
            <p>${message || ''}</p>
            <p><a href="${projectUrl}">View project</a></p>
            <p>Thanks,<br/>The Review Team</p>
          </div>
        `;
        const text = `Hello,\n\n${message || ''}\n\nProject: ${project.title}\nView: ${projectUrl}\n\nThank you,\nThe Review Team`;
        await transporter.sendMail({ from: process.env.USER_EMAIL, to: email, subject, text, html });
        emailSent = true;
      } catch (e) {
        console.error('Failed to send notify email:', e);
        emailError = e?.message || 'Failed to send email';
      }
    } else {
      emailError = 'Mailer not configured';
    }

    const populated = await Project.findById(project._id).populate('submittedBy','firstName lastName email').populate('assignedReviewers');
    res.status(200).json({ ...populated.toObject(), emailSent, emailError });
  } catch (error) {
    console.error('Error notifying project:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Set or fix submitter for an existing project (accepts { userId } or { email })
export const setProjectSubmitter = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId && !email) return res.status(400).json({ message: 'userId or email is required' });
    let user = null;
    if (userId) user = await User.findById(userId);
    if (!user && email) user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.submittedBy = user._id;
    if (user.email) project.clientEmail = user.email;
    await project.save();

    const populated = await Project.findById(project._id).populate('submittedBy', 'firstName lastName email').populate('assignedReviewers');
    res.status(200).json(populated);
  } catch (e) {
    console.error('Error setting project submitter:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If a new file was uploaded, remove the previous file from Cloudinary (if present)
    if (req.file) {
      if (project.document) {
        try {
          const parts = project.document.split('/');
          const fileName = parts.pop();
          const folder = parts.pop();
          const publicId = fileName.split('.')[0];
          const isPdf = /\.pdf$/i.test(fileName);
          const resourceType = isPdf ? 'raw' : 'image';
          const publicIdWithFolder = folder ? `${folder}/${publicId}` : publicId;
          await cloudinary.uploader.destroy(publicIdWithFolder, { resource_type: resourceType });
        } catch (e) {
          console.warn('Failed to delete old file from Cloudinary:', e?.message || e);
        }
      }

      // store new file info from multer/cloudinary
      project.document = req.file.path || req.file.secure_url || req.file.url || req.file?.location || project.document;
      project.public_id = req.file.public_id || req.file.filename || project.public_id;
    }

    // Update provided fields
    const updatable = ['title', 'summary', 'client', 'status', 'assignedReviewers', 'clientEmail'];
    updatable.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) project[k] = req.body[k];
    });

    await project.save();
    const populated = await Project.findById(project._id).populate('submittedBy','firstName lastName email').populate('assignedReviewers');
    res.status(200).json(populated);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Remove file from Cloudinary if present
    if (project.document) {
      try {
        const parts = project.document.split('/');
        const fileName = parts.pop();
        const folder = parts.pop();
        const publicId = fileName.split('.')[0];
        const isPdf = /\.pdf$/i.test(fileName);
        const resourceType = isPdf ? 'raw' : 'image';
        const publicIdWithFolder = folder ? `${folder}/${publicId}` : publicId;
        await cloudinary.uploader.destroy(publicIdWithFolder, { resource_type: resourceType });
      } catch (e) {
        console.warn('Failed to delete file from Cloudinary:', e?.message || e);
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
