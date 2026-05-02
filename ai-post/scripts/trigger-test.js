/**
 * MANUAL PIPELINE TRIGGER
 * Use this to test the entire flow (Trend -> Keyword -> Pillar -> Cluster)
 */
import 'dotenv/config';
import { trendQueue } from '../queues/index.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

async function triggerAutonomousFlow() {
  try {
    console.log("-----------------------------------------");
    console.log("🚀 TRIGGERING FULLY AUTONOMOUS PIPELINE...");
    console.log("-----------------------------------------");

    await mongoose.connect(process.env.MONGODB_URI);
    
    // Simulate exactly what the 2:00 AM cron does
    const platforms = ['reddit', 'google_trends', 'twitter', 'producthunt'];

    logger.info('[ManualTrigger] Waking up Trend Discovery agents...');
    
    for (const platform of platforms) {
      await trendQueue.add(`autonomous-trigger-${platform}-${Date.now()}`, { 
        platform 
      });
      console.log(`✅ ${platform} discovery started.`);
    }

    console.log("\n✨ All agents are now hunting for trends autonomously.");
    console.log("👉 Watch your terminal to see which viral topics they select!\n");
    
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    logger.error("❌ TRIGGER ERROR:", error.message);
    process.exit(1);
  }
}

triggerAutonomousFlow();

