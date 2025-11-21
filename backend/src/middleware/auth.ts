import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const checkResumeLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    
    // Reset counter if month has passed
    if (user.resetDate < new Date()) {
      user.resumeCount = 0;
      user.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
    }

    if (user.resumeCount >= user.resumeLimit) {
      return res.status(403).json({ 
        error: 'Resume limit reached',
        limit: user.resumeLimit,
        current: user.resumeCount
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking resume limit' });
  }
};
