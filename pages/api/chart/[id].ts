import { NextApiRequest, NextApiResponse } from 'next';
import { downloadData } from "aws-amplify/storage"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    try {
        const chartImage = await downloadData({
            path: `charts/${id}.png`,
        });
        res.setHeader('Content-Type', 'image/png');
        res.send(chartImage);
    } catch (error) {
        res.status(404).json({ message: 'Chart not found', error });
    }
} 