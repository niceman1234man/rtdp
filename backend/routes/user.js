import express from 'express';
const userRouter = express.Router();
import { createUser, getAllUsers, getUserById, deleteUser, updateUser,login,ForgotPassword,ResetPassword ,updatePassword} from '../controller/user.js';
// Route to create a new user
userRouter.post('/', createUser);
// Route for user login
userRouter.post('/login', login);
// Route to get all users
userRouter.get('/', getAllUsers);
// Route to get a specific user by ID
userRouter.get('/:id', getUserById);
// Route to update a user
userRouter.put('/:id', updateUser);
// Route to change password for a user (supports authenticated and param-based)
userRouter.post('/:id/change-password', updatePassword);
// Route to delete a user
userRouter.delete('/:id', deleteUser);
// Route for forgot password
userRouter.post('/forgot-password', ForgotPassword);
// Route for reset password
userRouter.post('/reset-password/:id/:token', ResetPassword);
export default userRouter;