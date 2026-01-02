import express from "express";
const reviewerRouter = express.Router();
import { createReviewer, getAllReviewers, getReviewerById, deleteReviewer, updateReviewer, updateReviewerPassword, loginReviewer, setReviewerPassword } from "../controller/reviewer.js";
import { requireAuth, requireRole } from '../middleware/auth.js'
// Route to create a new reviewer (admin only)
reviewerRouter.post("/", requireAuth, requireRole('admin'), createReviewer);
// Route for reviewer login
reviewerRouter.post('/login', loginReviewer);
// Route to get all reviewers (admin only)
reviewerRouter.get("/", requireAuth, requireRole('admin'), getAllReviewers);
// Route to get a specific reviewer by ID (admin or the reviewer themself)
reviewerRouter.get("/:id", requireAuth, getReviewerById);
// Route to update a reviewer (admin only)
reviewerRouter.put("/:id", requireAuth, updateReviewer);
// Route to change reviewer password (self-service)
reviewerRouter.post('/:id/change-password', requireAuth, updateReviewerPassword);
// Admin route to set/reset reviewer password
reviewerRouter.post('/:id/set-password', requireAuth, requireRole('admin'), setReviewerPassword);
// Route to delete a reviewer (admin only)
reviewerRouter.delete("/:id", requireAuth, requireRole('admin'), deleteReviewer);
export default reviewerRouter;