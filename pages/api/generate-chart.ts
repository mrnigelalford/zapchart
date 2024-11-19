import { NextApiRequest, NextApiResponse } from 'next';
import { S3 } from 'aws-amplify';
import puppeteer from 'puppeteer';
import Chart from 'chart.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { data, options } = req.body; // Expecting chart data and options

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(`
            <html>
                <body>
                    <canvas id="chart"></canvas>
                    <script>
                        const ctx = document.getElementById('chart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar', // Example chart type
                            data: ${JSON.stringify(data)},
                            options: ${JSON.stringify(options)}
                        });
                    </script>
                </body>
            </html>
        `);

        const chartImage = await page.screenshot({ type: 'png' });
        await browser.close();

        const s3Response = await S3.put({
            key: `charts/${Date.now()}.png`,
            body: chartImage,
            contentType: 'image/png'
        });

        res.status(200).json({ message: 'Chart generated and stored', s3Response });
    } catch (error) {
        res.status(500).json({ message: 'Error generating chart', error });
    }
} 