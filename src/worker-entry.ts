import mongoose from 'mongoose';
import { config } from './config/index.js';
import { ReviewWorker } from './modules/queue/review.worker.js';

async function startWorker() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongo.uri);
    console.log('Worker connected to MongoDB');

    // Initialize Worker
    const worker = new ReviewWorker();
    console.log('Review Worker started and listening for jobs');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Worker SIGTERM received. Shutting down...');
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('Worker failed to start:', err);
    process.exit(1);
  }
}

startWorker();

intentionalBug();
