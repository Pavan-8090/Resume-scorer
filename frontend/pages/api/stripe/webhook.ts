import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Proxy the request to backend
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stripe/webhook`,
      req.body,
      {
        headers: {
          'stripe-signature': req.headers['stripe-signature'] || '',
          'content-type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
