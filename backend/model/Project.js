import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: String, required: true },
  status: { type: String, enum: ['submitted', 'in-review', 'accepted', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now },
  summary: { type: String, required: true },
  assignedReviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reviewer' }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientEmail: { type: String },
  // cloudinary file attachment (optional)
  fileUrl: { type: String },
  fileName: { type: String },
  reviews: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reviewer', default: null },
    reviewerName: { type: String },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
})

const Project = mongoose.model('Project', projectSchema)
export default Project

