import Stripe from 'stripe';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { priceId } = req.body;
    const user = req.user;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        userId: user._id.toString(),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
};

export const handleWebhook = async (req: AuthRequest, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Missing signature or webhook secret');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.stripeSubscriptionId = session.subscription as string;
            await user.save();
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          const priceId = subscription.items.data[0]?.price.id;

          // Map Stripe price IDs to tiers
          if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
            user.subscriptionTier = 'pro';
            user.resumeLimit = Infinity;
          } else if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
            user.subscriptionTier = 'team';
            user.resumeLimit = Infinity;
          }

          user.stripeSubscriptionId = subscription.id;
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionTier = 'free';
          user.resumeLimit = 5;
          user.stripeSubscriptionId = undefined;
          await user.save();
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
