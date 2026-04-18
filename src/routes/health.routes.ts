import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from '../config/index.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Code Reviewer - Online</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #6366f1;
                --bg: #0f172a;
                --text: #f8fafc;
            }
            body {
                margin: 0;
                font-family: 'Outfit', sans-serif;
                background: var(--bg);
                color: var(--text);
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                overflow: hidden;
            }
            .container {
                text-align: center;
                padding: 3rem;
                background: rgba(30, 41, 59, 0.5);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 500px;
                animation: fadeIn 0.8s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
                background: linear-gradient(to right, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                color: #94a3b8;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            .status {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                background: rgba(34, 197, 94, 0.1);
                color: #4ade80;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 600;
                margin-top: 1.5rem;
            }
            .status::before {
                content: '';
                display: block;
                width: 8px;
                height: 8px;
                background: #4ade80;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 10px #4ade80;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>AI Code Reviewer</h1>
            <p>Your multi-agent orchestration service is online and ready to audit your Pull Requests.</p>
            <div class="status">System Operational</div>
        </div>
    </body>
    </html>
  `);
});

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req: Request, res: Response) => {
  const status: any = {
    db: 'unknown',
    redis: 'unknown',
  };

  try {
    if (mongoose.connection.readyState === 1) {
      status.db = 'connected';
    } else {
      status.db = 'disconnected';
    }
  } catch (e: any) {
    status.db = 'error';
  }

  try {
    const redisClient = createClient({ 
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password 
    });
    await redisClient.connect();
    status.redis = 'connected';
    await redisClient.disconnect();
  } catch (e: any) {
    status.redis = 'error';
  }

  const isReady = status.db === 'connected' && status.redis === 'connected';
  res.status(isReady ? 200 : 503).json({ status: isReady ? 'ready' : 'not_ready', details: status });
});

export default router;
