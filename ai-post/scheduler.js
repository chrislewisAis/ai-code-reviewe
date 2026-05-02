import cron from 'node-cron';
import { trendQueue } from './queues/index.js';

export function initScheduler() {
  // Every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Starting daily SEO pipeline...');
    
    // Trigger trend discovery
    const platforms = ['google_trends', 'reddit', 'twitter', 'producthunt'];
    
    for (const platform of platforms) {
      await trendQueue.add(`trend-${platform}-${Date.now()}`, { platform });
    }
  });

  // Ranking monitor every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Refreshing rankings...');
    // Add to update queue
  });

  console.log('[Scheduler] Cron jobs initialized.');
}
