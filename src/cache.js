// src/cache.js
import Redis from 'ioredis';
import logger from '../logger.js';

let redis;
let isConnecting = false;

const MAX_RETRIES = Number(process.env.REDIS_CONNECTION_MAX_RETRIES || 5);
const RETRY_DELAY = Number(process.env.REDIS_CONNECTION_RETRY_DELAY || 2000);
const COOLDOWN = Number(process.env.REDIS_COOLDOWN || 10000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createRedisInstance = () => {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: null,
  });
};

const connectWithRetry = async () => {
  if (isConnecting) return;
  isConnecting = true;

  while (true) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.warn(`Redis connection attempt ${attempt}/${MAX_RETRIES}`);

        redis = createRedisInstance();

        await new Promise((resolve, reject) => {
          redis.once('ready', resolve);
          redis.once('error', reject);
        });

        logger.info('Redis connected successfully');

        setupListeners();
        isConnecting = false;
        return;
      } catch (err) {
        logger.error(`Redis connection failed: ${err.message}`);

        if (attempt < MAX_RETRIES) {
          logger.warn(`Retrying in ${RETRY_DELAY}ms...`);
          await sleep(RETRY_DELAY);
        }
      }
    }

    logger.error(
      `Max retries reached. Cooling down for ${COOLDOWN}ms before retrying...`
    );
    await sleep(COOLDOWN);
  }
};

const setupListeners = () => {
  redis.on('close', async () => {
    logger.warn('Redis connection closed. Reconnecting...');
    await connectWithRetry();
  });

  redis.on('error', (err) => {
    logger.error(`Redis error: ${err}`);
  });
};

export const connectRedis = async () => {
  await connectWithRetry();
  return redis;
};

export const getRedis = () => redis;

export const disconnectRedis = async () => {
  if (redis) {
    logger.warn('Disconnecting Redis...');
    redis.removeAllListeners();
    await redis.quit();
    redis = null;
  }
  logger.info('Redis disconnected');
};

export function isRedisEnabled() {
  return process.env.ENABLE_REDIS.toLocaleLowerCase() === 'true';
}
