import express from 'express';
const projectRouter = express.Router();
import { createProject, getAllProjects,getProjectById,deleteProject,updateProject, getReviews, addReview, assignReviewer, decideProject, unassignReviewer, notifyProject, setProjectSubmitter } from '../controller/project.js'
import { upload } from '../config/cloudinary.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// Route to create a new project (simple JSON)
projectRouter.post('/', upload.single('file'), createProject);
projectRouter.put('/:id', requireAuth, upload.single('file'), updateProject);
projectRouter.delete('/:id', requireAuth, deleteProject);
// Route to get all projects (supports ?assignedTo=<id|me>)
projectRouter.get('/', getAllProjects);
// Route to get a specific project by ID
projectRouter.get('/:id', getProjectById);
// Route to update a project
projectRouter.put('/:id', updateProject);
// Route to delete a project
projectRouter.delete('/:id', deleteProject);

// Reviews routes
projectRouter.get('/:id/reviews', getReviews);
// posting reviews requires reviewer authentication
projectRouter.post('/:id/reviews', requireAuth, requireRole('reviewer'), addReview);

// Assignment and decision routes (admin only)
projectRouter.post('/:id/assign', requireAuth, requireRole('admin'), assignReviewer);
projectRouter.post('/:id/unassign', requireAuth, requireRole('admin'), unassignReviewer);
projectRouter.post('/:id/decision', requireAuth, requireRole('admin'), decideProject);
projectRouter.post('/:id/notify', requireAuth, requireRole('admin'), notifyProject);
projectRouter.post('/:id/set-submitter', requireAuth, requireRole('admin'), setProjectSubmitter);

// // Upload or replace file for an existing project (owner or admin)
// projectRouter.post('/:id/upload', requireAuth, upload.single('file'), uploadProjectFile);

export default projectRouter;