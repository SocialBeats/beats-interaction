// src/utils/moderationEngine.js
import crypto from 'crypto';
import { getRedis } from '../cache.js';
import { analyzeContent } from './openRouterClient.js';

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function moderateText(text) {
  let redis = getRedis();
  const key = `moderation:${hashText(text)}`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await analyzeContent(text);

  await redis.set(key, JSON.stringify(result), 'EX', 60 * 60 * 24);

  return result;
}
