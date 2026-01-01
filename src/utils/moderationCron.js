import cron from 'node-cron';
import { retryPendingModerations } from './moderationWorker.js';
import { isRedisEnabled } from '../cache.js';
import logger from '../../logger.js';

let moderationCron = null;

export function startModerationCron() {
  if (!isRedisEnabled()) {
    logger.info('Redis disabled, moderation cron will not start');
    return;
  }

  if (moderationCron) {
    logger.info('Moderation cron already running');
    return;
  }

  moderationCron = cron.schedule('*/5 * * * *', async () => {
    logger.info('Running moderation retry cron');
    try {
      await retryPendingModerations();
    } catch (error) {
      logger.error('Error in moderation cron:', error);
    }
  });

  logger.info('Moderation retry cron started (runs every 5 minutes)');
}

export function pauseModerationCron() {
  if (moderationCron) {
    moderationCron.stop();
    logger.info('Moderation cron paused');
  }
}

export function resumeModerationCron() {
  if (moderationCron) {
    moderationCron.start();
    logger.info('Moderation cron resumed');
  }
}

export function stopModerationCron() {
  if (moderationCron) {
    moderationCron.stop();
    moderationCron = null;
    logger.info('Moderation cron stopped and destroyed');
  }
}
