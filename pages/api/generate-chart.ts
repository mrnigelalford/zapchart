import { NextApiRequest, NextApiResponse } from 'next';
import { put, list } from '@vercel/blob';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { withApiAuth } from './auth';
import { transformZapierData } from '../../utils/zapier';
import { ZapierChartInput } from '../../types/zapier';
// Cache interface
// interface ChartCache {
//   hash: string;
//   url: string;
//   pathname: string;
//   createdAt: number;
// }

const generateChart = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Create hash of the request data
  const dataHash = crypto
    .createHash('md5')
    .update(JSON.stringify({ data: req.body.data, options: req.body.options }))
    .digest('hex');

  try {
    // Check if we have this chart cached
    const { blobs } = await list({ prefix: 'charts/' });
    const cachedChart = blobs.find(blob => blob.pathname.includes(dataHash));

    if (cachedChart) {
      return res.status(200).json({
        message: 'Chart retrieved from cache',
        id: dataHash,
        url: `/api/chart/${dataHash}`,
        cached: true
      });
    }

    // If not cached, generate new chart
    let browser;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
          width: 800,
          height: 400,
          deviceScaleFactor: 2,
        }
      });
      
      const page = await browser.newPage();

      const defaultOptions = {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Chart'
          }
        }
      };

      // Handle Zapier webhook data format
      const chartData = req.headers['x-zapier-webhook'] 
        ? transformZapierData(req.body as ZapierChartInput)
        : req.body.data;

      const chartOptions = {
        ...defaultOptions,
        ...req.body.options
      };

      await page.setContent(`
        <html>
          <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              #chartContainer {
                width: 800px;
                height: 400px;
              }
            </style>
          </head>
          <body>
            <div id="chartContainer">
              <canvas id="chart"></canvas>
            </div>
            <script>
              async function renderChart() {
                const ctx = document.getElementById('chart').getContext('2d');
                const chart = new Chart(ctx, {
                  type: 'bar',
                  data: ${JSON.stringify(chartData)},
                  options: {
                    ...${JSON.stringify(chartOptions)},
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: true
                  }
                });
                window.chartRendered = true;
              }
              renderChart();
            </script>
          </body>
        </html>
      `);

      await page.waitForFunction('window.chartRendered === true', { timeout: 5000 });
      
      // Use waitForTimeout equivalent since it's deprecated
      await new Promise(resolve => setTimeout(resolve, 500));

      const chartImage = await page.screenshot({
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 800,
          height: 400
        },
        omitBackground: false
      });

      await browser.close();

      // Store with hash in filename
      const blob = await put(`charts/${dataHash}.png`, Buffer.from(chartImage), {
        access: 'public',
        contentType: 'image/png',
      });

      const response = {
        message: 'Chart generated and stored',
        id: dataHash,
        url: `/api/chart/${dataHash}`,
        imageUrl: blob.url, // Direct URL for Zapier
        cached: false
      };

      // Format response based on caller
      if (req.headers['x-zapier-webhook']) {
        // Zapier expects a simplified response
        res.status(200).json({
          id: response.id,
          url: `${process.env.NEXT_PUBLIC_BASE_URL}${response.url}`,
          imageUrl: response.imageUrl
        });
      } else {
        res.status(200).json(response);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Error generating chart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 

export default withApiAuth(generateChart);