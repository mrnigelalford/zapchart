import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
                data: ${JSON.stringify(req.body.data)},
                options: {
                  ...${JSON.stringify(req.body.options)},
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

    const blob = await put(`charts/${Date.now()}.png`, Buffer.from(chartImage), {
      access: 'public',
      contentType: 'image/png',
    });

    res.status(200).json({ 
      message: 'Chart generated and stored', 
      url: blob.url,
      pathname: blob.pathname
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error generating chart', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 