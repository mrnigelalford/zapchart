import { NextApiRequest, NextApiResponse } from 'next';
import { cors } from '@/cors';

const API_KEY = process.env.API_KEY;

const corsMiddleware = cors({
  methods: ['POST'],
  origin: 'https://zapier.com',
  optionsSuccessStatus: 200
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify API key from headers
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  // TODO: Validate API key against your database
  
  res.status(200).json({
    status: 'success',
    message: 'Authentication successful'
  });
}

export function withApiAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing API key' 
      });
    }

    return handler(req, res);
  };
}
