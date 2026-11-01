import mongoose from 'mongoose';

const studySchema = new mongoose.Schema(
  {
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: String,
    surveyUrl: { 
      type: String, 
      required: true 
    },
    rewardPerWorker: { 
      type: Number, 
      required: true 
    },
    maxParticipants: { 
      type: Number, 
      required: true 
    },
    availableSpots: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'],
      default: 'DRAFT'
    },
    completionCode: { 
      type: String, 
      required: true 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Study', studySchema);