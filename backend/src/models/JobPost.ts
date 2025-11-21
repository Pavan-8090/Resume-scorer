import mongoose from 'mongoose';

export interface IJobPost extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  jobDescription: string;
  status: 'pending' | 'analyzing' | 'completed';
  createdAt: Date;
}

const JobPostSchema = new mongoose.Schema<IJobPost>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  title: { type: String, required: true },
  jobDescription: { type: String, required: true },
  status: { type: String, enum: ['pending', 'analyzing', 'completed'], default: 'pending' },
}, { timestamps: true });

export const JobPost = mongoose.model<IJobPost>('JobPost', JobPostSchema);
