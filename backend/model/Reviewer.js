import mongoose from 'mongoose';

const reviewerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String,  },
  role: { type: String,  },
title: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Reviewer = mongoose.model('Reviewer', reviewerSchema);
export default Reviewer;