import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
    role: { type: String, enum: ['user', 'reviewer', 'admin'], default: 'user'},
    organization: { type: String },
    fieldOfStudy: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);
export default User;
