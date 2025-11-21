import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { JobPost } from '../models/JobPost';
import { Analysis } from '../models/Analysis';

export const getJobPosts = async (req: AuthRequest, res: Response) => {
  try {
    const jobPosts = await JobPost.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'email');

    const jobPostsWithCounts = await Promise.all(
      jobPosts.map(async (job) => {
        const analysisCount = await Analysis.countDocuments({ jobPostId: job._id });
        return {
          id: job._id,
          title: job.title,
          status: job.status,
          createdAt: job.createdAt,
          resumeCount: analysisCount,
        };
      })
    );

    res.json(jobPostsWithCounts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching job posts' });
  }
};

export const createJobPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, jobDescription } = req.body;

    if (!title || !jobDescription) {
      return res.status(400).json({ error: 'Title and job description are required' });
    }

    const jobPost = new JobPost({
      userId: req.userId || null,
      title,
      jobDescription,
      status: 'pending',
    });

    await jobPost.save();
    res.status(201).json(jobPost);
  } catch (error: any) {
    console.error('Error creating job post:', error);
    res.status(500).json({ error: 'Error creating job post', details: error.message });
  }
};

export const getJobPost = async (req: AuthRequest, res: Response) => {
  try {
    let jobPost;
    if (req.userId) {
      jobPost = await JobPost.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
    } else {
      jobPost = await JobPost.findById(req.params.id);
    }

    if (!jobPost) {
      return res.status(404).json({ error: 'Job post not found' });
    }

    res.json(jobPost);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching job post' });
  }
};

export const getAnalyses = async (req: AuthRequest, res: Response) => {
  try {
    const jobPost = await JobPost.findById(req.params.jobId);

    if (!jobPost) {
      return res.status(404).json({ error: 'Job post not found' });
    }

    // Check if user owns this job post (if authenticated)
    if (req.userId && jobPost.userId && jobPost.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analyses = await Analysis.find({ jobPostId: req.params.jobId })
      .sort({ matchScore: -1 });

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching analyses' });
  }
};
