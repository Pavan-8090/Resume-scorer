import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      subscriptionTier: 'free',
      resumeLimit: 5,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        resumeCount: user.resumeCount,
        resumeLimit: user.resumeLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        resumeCount: user.resumeCount,
        resumeLimit: user.resumeLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};

export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      resumeCount: user.resumeCount,
      resumeLimit: user.resumeLimit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};
