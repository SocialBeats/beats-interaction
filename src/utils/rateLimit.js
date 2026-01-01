import logger from '../../logger.js';

export async function allowModerationRequest(redis) {
  const key = 'openrouter:rate';
  const limit = 30;
  const windowSeconds = 60;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  const allowed = current <= limit;
  if (!allowed) {
    logger.warn(`Rate limit exceeded: ${current}/${limit} requests`);
  }
  return allowed;
}
