import { NextApiRequest, NextApiResponse } from 'next';
import { put, list } from '@vercel/blob';
import puppeteer from 'puppeteer';
import crypto from 'crypto';

// Cache interface
interface ChartCache {
  hash: string;
  url: string;
  pathname: string;
  createdAt: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

      const defaultStyles = {
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      };

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

      // Merge incoming data with defaults
      const chartData = {
        ...req.body.data,
        datasets: req.body.data.datasets.map(dataset => ({
          ...defaultStyles,
          ...dataset
        }))
      };

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

      res.status(200).json({
        message: 'Chart generated and stored',
        id: dataHash,
        url: `/api/chart/${dataHash}`,
        cached: false
      });
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