import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { githubWebhookHandler } from './modules/webhooks/github.webhook.js';
import { socketService } from './modules/realtime/socket.service.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP temporarily to bypass browser caching issues
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

// Health Routes
app.use('/', healthRoutes);

// Webhook Route
app.post('/webhooks/github', (req: Request, res: Response, next: NextFunction) => {
  githubWebhookHandler.handle(req, res).catch(next);
});

// Socket.IO Initialization
socketService.init(server as any);

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
});

// Database Connection & Server Start
mongoose
  .connect(config.mongo.uri)
  .then(() => {
    console.log('Connected to MongoDB');
    const port = config.port;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});
