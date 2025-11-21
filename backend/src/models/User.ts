import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  subscriptionTier: 'free' | 'pro' | 'team';
  resumeCount: number;
  resumeLimit: number;
  resetDate: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscriptionTier: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
  resumeCount: { type: Number, default: 0 },
  resumeLimit: { type: Number, default: 5 },
  resetDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
