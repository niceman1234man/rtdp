import express from 'express';
const userRouter = express.Router();
import { createUser, getAllUsers, getUserById, deleteUser, updateUser,login,ForgotPassword,ResetPassword ,updatePassword} from '../controller/user.js';
import { requireAuth, requireRole } from '../middleware/auth.js'
// Route to create a new user
userRouter.post('/', createUser);
// Route for user login
userRouter.post('/login', login);
// Route to get all users (admin only)
userRouter.get('/', requireAuth, requireRole('admin'), getAllUsers);
// Route to get a specific user by ID (requires auth)
userRouter.get('/:id', requireAuth, getUserById);
// Route to update a user (requires auth)
userRouter.put('/:id', requireAuth, updateUser);
// Route to change password for a user (requires auth)
userRouter.post('/:id/change-password', requireAuth, updatePassword);
// Route to delete a user (admin only)
userRouter.delete('/:id', requireAuth, requireRole('admin'), deleteUser);
// Route for forgot password
userRouter.post('/forgot-password', ForgotPassword);
// Route for reset password
userRouter.post('/reset-password/:id/:token', ResetPassword);
export default userRouter;