import 'dotenv/config';
import mongoose from 'mongoose';
import { initAgents } from './agents/factory.js';
import { startWorkers } from './queues/index.js';
import { initScheduler } from './scheduler.js';
import { startMonitoringServer } from './monitor.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('[Main] Connected to MongoDB.');

    // 2. Initialize Agents
    initAgents();

    // 3. Start Monitoring (Enterprise Feature)
    startMonitoringServer();

    // 4. Start Scheduler
    initScheduler();

    logger.info('[Conductor] AI Blog Factory Conductor is LIVE.');
    logger.info('[Conductor] Monitoring API: http://localhost:3000');
    logger.info('[Conductor] Cron Jobs: Active (0 2 * * *)');

  } catch (err) {
    logger.error('[Conductor] Critical Failure during setup', { error: err.message });
    process.exit(1);
  }
}


// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`[Main] ${signal} received. Closing connections...`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap();

