import crypto from 'crypto';
import { getRedis } from '../cache.js';
import { analyzeContent } from './openRouterClient.js';
import { allowModerationRequest, incrementDailyCount } from './rateLimit.js';

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function moderateText(text, contentId, contentType = 'unknown') {
  const redis = getRedis();
  const textHash = hashText(text);

  const hashCacheKey = `moderation:hash:${textHash}`;
  const contentHashKey = `moderation:content:${contentType}:${contentId}`;

  const lastHash = await redis.get(contentHashKey);

  if (lastHash && lastHash === textHash) {
    const cached = await redis.get(hashCacheKey);
    if (cached) {
      const result = JSON.parse(cached);
      return { ...result, cached: true };
    }
  }

  const hashCached = await redis.get(hashCacheKey);
  if (hashCached) {
    const result = JSON.parse(hashCached);
    await redis.set(contentHashKey, textHash, 'EX', 60 * 60 * 24 * 30);
    return { ...result, cached: true };
  }

  const allowed = await allowModerationRequest(redis);
  if (!allowed) {
    return { verdict: 'pending', reason: 'rate_limited' };
  }

  const result = await analyzeContent(text);

  if (result.verdict !== 'pending') {
    await incrementDailyCount(redis);
    await redis.set(hashCacheKey, JSON.stringify(result), 'EX', 60 * 60 * 24);

    await redis.set(contentHashKey, textHash, 'EX', 60 * 60 * 24 * 30);
  }

  return { ...result, cached: false };
}

export async function invalidateContentCache(contentId, contentType) {
  const redis = getRedis();
  const contentHashKey = `moderation:content:${contentType}:${contentId}`;
  await redis.del(contentHashKey);
}
