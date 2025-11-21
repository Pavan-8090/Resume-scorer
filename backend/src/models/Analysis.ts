import mongoose from 'mongoose';

export interface IAnalysis extends mongoose.Document {
  jobPostId: mongoose.Types.ObjectId;
  candidateName: string;
  resumeText: string;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  skillMatches: string[];
  createdAt: Date;
}

const AnalysisSchema = new mongoose.Schema<IAnalysis>({
  jobPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
  candidateName: { type: String, required: true },
  resumeText: { type: String, required: true },
  matchScore: { type: Number, required: true, min: 0, max: 100 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  skillMatches: [{ type: String }],
}, { timestamps: true });

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
