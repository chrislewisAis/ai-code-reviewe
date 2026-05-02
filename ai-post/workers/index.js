import 'dotenv/config';
import mongoose from 'mongoose';
import { initAgents } from '../agents/factory.js';
import { startWorkers } from '../queues/index.js';
import { mainWorkflow } from '../workflows/main.js';
import { logger } from '../utils/logger.js';

async function runWorker() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('[WorkerNode] Connected to MongoDB.');

    // Initialize 200+ agents in the worker process
    initAgents();

    const handlers = {
      trend: async (job) => {
        const platform = job.data.platform;
        logger.info(`[Worker] Waking up Trend Analyst for ${platform}`, { platform });

        // Map platform to specific extraction agent
        const agentMap = {
          reddit: 'reddit_topic_extractor_agent',
          google_trends: 'google_trends_spike_detector_agent',
          twitter: 'twitter_topic_velocity_agent',
          producthunt: 'producthunt_trending_agent'
        };

        const agentName = agentMap[platform] || 'reddit_topic_extractor_agent';
        const agent = initAgents().get(agentName); // Getting from registry

        const discovery = await agent.execute({ platform });
        
        // Robust Topic Extraction (Handles JSON vs String vs Missing fields)
        const topic = discovery.topic || discovery.content || (typeof discovery === 'string' ? discovery : 'Latest Trends');
        
        // Push discovery to Content Silo Queue
        const { contentQueue } = await import('../queues/index.js');
        await contentQueue.add(`silo-${Date.now()}`, { 
          trendData: discovery,
          topic: topic.split('\n')[0].substring(0, 100) // Sanitize topic
        });

        logger.info(`[Worker] Trend Confirmed: ${topic}. Handing over to Silo Engine.`);
      },

      content: async (job) => {
        logger.info(`[Worker] Starting Main Workflow for "${job.data.topic}"`);
        // Trigger the LangGraph State Machine
        const result = await mainWorkflow.invoke({ trendData: job.data.trendData });
        
        logger.info(`[Worker] Silo Complete. Generated Pillar and ${result.clusters.length} Clusters.`);
        return result;
      }
    };


    startWorkers(handlers);
    logger.info('[WorkerNode] Ready to process SEO Silos.');

  } catch (err) {
    logger.error('[WorkerNode] Critical Worker Failure:', { error: err.message });
    process.exit(1);
  }
}

runWorker();
