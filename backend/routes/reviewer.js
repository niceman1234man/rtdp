import express from "express";
const reviewerRouter = express.Router();
import { createReviewer, getAllReviewers, getReviewerById, deleteReviewer, updateReviewer, updateReviewerPassword, loginReviewer, setReviewerPassword } from "../controller/reviewer.js";
// Route to create a new reviewer
reviewerRouter.post("/", createReviewer);
// Route for reviewer login
reviewerRouter.post('/login', loginReviewer);
// Route to get all reviewers
reviewerRouter.get("/", getAllReviewers);
// Route to get a specific reviewer by ID
reviewerRouter.get("/:id", getReviewerById);
// Route to update a reviewer
reviewerRouter.put("/:id", updateReviewer);
// Route to change reviewer password (self-service)
reviewerRouter.post('/:id/change-password', updateReviewerPassword);
// Admin route to set/reset reviewer password
reviewerRouter.post('/:id/set-password', setReviewerPassword);
// Route to delete a reviewer
reviewerRouter.delete("/:id", deleteReviewer);
export default reviewerRouter;