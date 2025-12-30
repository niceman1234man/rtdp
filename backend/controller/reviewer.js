import Reviewer from "../model/Reviewer.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create a new reviewer and send a randomly generated password via email
export const createReviewer = async (req, res) => {
  try {
    const { firstName, lastName, email, title } = req.body;
    if (!firstName || !lastName || !email) return res.status(400).json({ message: 'firstName, lastName and email are required' });

    // generate a random password (8 chars, URL-safe)
    const rawPassword = crypto.randomBytes(6).toString('base64').replace(/\+/g,'0').replace(/\//g,'0').slice(0,8);
    console.log(`Generated reviewer password for ${email}: ${rawPassword}`); // debug log — remove for production
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(rawPassword, salt);

    const newReviewer = new Reviewer({ firstName, lastName, email, password: hashed, title, role: 'reviewer' });
    await newReviewer.save();

    // send email with credentials if mailer is configured
    let emailSent = false;
    let emailError = null;
    if (process.env.USER_EMAIL && process.env.PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.USER_EMAIL, pass: process.env.PASSWORD }
        });
        const subject = `Your reviewer account for Review Team`;
        const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
        const loginUrl = `${frontend}/login`;
        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Reviewer account created</h2>
            <p>Hello ${firstName},</p>
            <p>An account has been created for you as a reviewer.</p>
            <p><strong>Login:</strong> ${email}</p>
            <p><strong>Password:</strong> ${rawPassword}</p>
            <p>You can sign in at <a href="${loginUrl}">Login</a>. Please change your password after first login.</p>
            <p>Thanks,<br/>The Review Team</p>
          </div>
        `;
        const text = `Hello ${firstName},\n\nAn account has been created for you as a reviewer.\n\nLogin: ${email}\nPassword: ${rawPassword}\n\nSign in: ${loginUrl}\n\nPlease change your password after first login.\n\nThanks,\nThe Review Team`;
        await transporter.sendMail({ from: process.env.USER_EMAIL, to: email, subject, text, html });
        emailSent = true;
      } catch (e) {
        console.error('Failed to send reviewer welcome email:', e);
        emailError = e?.message || 'Failed to send email';
      }
    }

    // do not return password hash
    const out = { ...newReviewer.toObject() };
    delete out.password;
    res.status(201).json({ reviewer: out, emailSent, emailError });
  } catch (error) {
    console.error('Error creating reviewer:', error);
    if (error && error.code === 11000) return res.status(400).json({ message: 'A reviewer with this email already exists' });
    res.status(500).json({ message: 'Server error' });
  }
}

// Reviewer login
export const loginReviewer = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Reviewer login attempt for:', email);
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      console.log('Reviewer not found for email:', email);
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    console.log('Reviewer found:', reviewer._id.toString(), 'password hash length:', (reviewer.password || '').length);
    const isMatch = await bcrypt.compare(password, reviewer.password || '');
    console.log('Password compare result for', email, ':', !!isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-secret';
    const accessToken = jwt.sign({ userId: reviewer._id, email: reviewer.email, role: 'reviewer' }, secret, { expiresIn: '10h' });

    const out = { ...reviewer.toObject() };
    delete out.password;
    res.status(200).json({ reviewer: out, accessToken });
  } catch (error) {
    console.error('Reviewer login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const getAllReviewers = async (req, res) => {
  try {
    const reviewers = await Reviewer.find();
    res.status(200).json(reviewers);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
export const getReviewerById = async (req, res) => {
  try {
    const reviewer = await Reviewer.findById(req.params.id);
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    res.status(200).json(reviewer);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}
export const updateReviewer = async (req, res) => {
  try {
    const reviewer = await Reviewer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    res.status(200).json(reviewer);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}

export const updateReviewerPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'New passwords do not match' });
    const reviewer = await Reviewer.findById(req.params.id);
    if (!reviewer) return res.status(404).json({ message: 'Reviewer not found' });
    const isMatch = await require('bcryptjs').compare(oldPassword, reviewer.password || '');
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });
    const salt = await require('bcryptjs').genSalt(10);
    const hashed = await require('bcryptjs').hash(newPassword, salt);
    reviewer.password = hashed;
    await reviewer.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating reviewer password:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
export const deleteReviewer = async (req, res) => {
  try {
    const reviewer = await Reviewer.findByIdAndDelete(req.params.id);
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    res.status(200).json({ message: 'Reviewer deleted' });
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}

// Admin endpoint to set/reset reviewer password and optionally email it
export const setReviewerPassword = async (req, res) => {
  try {
    const { password, emailNotify } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const reviewer = await Reviewer.findById(req.params.id);
    if (!reviewer) return res.status(404).json({ message: 'Reviewer not found' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    reviewer.password = hashed;
    await reviewer.save();

    let emailSent = false;
    let emailError = null;
    if (emailNotify && process.env.USER_EMAIL && process.env.PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.USER_EMAIL, pass: process.env.PASSWORD } });
        const subject = 'Your reviewer password has been reset';
        const text = `Your password has been reset. New password: ${password}`;
        await transporter.sendMail({ from: process.env.USER_EMAIL, to: reviewer.email, subject, text });
        emailSent = true;
      } catch (e) {
        console.error('Failed to send password reset email:', e);
        emailError = e?.message || 'Failed to send email';
      }
    }

    res.status(200).json({ message: 'Password updated', emailSent, emailError });
  } catch (e) {
    console.error('Error setting reviewer password:', e);
    res.status(500).json({ message: 'Server error' });
  }
}