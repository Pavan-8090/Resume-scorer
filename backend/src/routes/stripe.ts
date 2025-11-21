import { Router } from 'express';
import express from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/stripeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Stripe webhook must be before express.json() middleware
router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook as any
);

// Checkout session creation
router.post('/stripe/create-checkout-session', authMiddleware, createCheckoutSession);

export default router;
