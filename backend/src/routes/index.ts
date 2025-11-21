import { Router } from 'express';
import multer from 'multer';
import { register, login, getCurrentUser } from '../controllers/authController';
import {
  getJobPosts,
  createJobPost,
  getJobPost,
  getAnalyses,
} from '../controllers/jobController';
import { analyzeResumes } from '../controllers/analysisController';
import { authMiddleware, checkResumeLimit } from '../middleware/auth';
import stripeRoutes from './stripe';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  },
});

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/user', authMiddleware, getCurrentUser);

// Job post routes - make auth optional
router.get('/jobs', authMiddleware, getJobPosts);
router.post('/jobs', createJobPost); // No auth required
router.get('/jobs/:id', getJobPost); // No auth required
router.get('/jobs/:jobId/analyses', getAnalyses); // No auth required

// Analysis routes - make auth optional
router.post(
  '/jobs/:jobId/analyze',
  upload.fields([
    { name: 'resumes', maxCount: 10 },
  ]),
  analyzeResumes
);

// Stripe routes
router.use(stripeRoutes);

export default router;
