import { NextApiRequest, NextApiResponse } from 'next';
import { list } from '@vercel/blob';
import { cors } from '@/cors';
import { withApiAuth } from '../auth';

// CORS middleware to allow all origins
const corsMiddleware = cors({
  methods: ['GET'],
  origin: '*',
  optionsSuccessStatus: 200
});

const getChart = async (req: NextApiRequest, res: NextApiResponse) => {
  // Handle CORS
  await corsMiddleware(req, res);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid chart ID' });
  }

  try {
    // List all blobs and find one that starts with our ID
    const { blobs } = await list({ prefix: 'charts/' });
    const blob = blobs.find(blob => blob.pathname.includes(`charts/${id}`));
    
    if (!blob) {
      return res.status(404).json({ message: 'Chart not found' });
    }

    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/png');
    
    // Redirect to the blob URL
    res.redirect(blob.url);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error retrieving chart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 

export default withApiAuth(getChart);