import { NextApiRequest, NextApiResponse } from 'next';
import { S3 } from 'aws-amplify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    try {
        const chartImage = await S3.get(`charts/${id}.png`, { download: true });
        res.setHeader('Content-Type', 'image/png');
        res.send(chartImage.Body);
    } catch (error) {
        res.status(404).json({ message: 'Chart not found', error });
    }
} 