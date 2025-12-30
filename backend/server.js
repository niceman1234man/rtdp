import express from 'express';
import cors from "cors";
import projectRouter from './routes/project.js';
import userRouter from './routes/user.js';
import reviewerRouter from './routes/reviewer.js';
import { connectDb } from './config/db.js';
const app = express();
app.use(express.json());

// CORS must be enabled before routes so preflight (OPTIONS) requests
// get the proper Access-Control-Allow-* headers.
app.use(
  cors({
    origin: ["https://rtdp.netlify.app"],
    credentials: true,
  })
);

// lightweight auth middleware to populate req.user when Authorization header is present
import authMiddleware from './middleware/auth.js';
app.use(authMiddleware);

// allow preflight for all routes (optional but useful)


app.use('/api/projects', projectRouter);
app.use('/api/users', userRouter);
app.use('/api/reviewers', reviewerRouter);

connectDb();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
