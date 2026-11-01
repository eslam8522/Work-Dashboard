import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true },
    content: { type: String },
    // RESERVED -> pending (worker entered the code) -> accepted | rejected (admin review)
    status: { type: String, enum: ['RESERVED', 'pending', 'accepted', 'rejected'], default: 'RESERVED' },
    adminFeedback: { type: String, default: '' },
    completedAt: Date,
  },
  { timestamps: true }
);

// One submission per worker per study. This is what makes double-reserving impossible.
submissionSchema.index({ workerId: 1, studyId: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
