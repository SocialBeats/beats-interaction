import logger from '../../logger.js';

const RPM_LIMIT = 18;
const DAILY_LIMIT = 45;

export async function allowModerationRequest(redis) {
  const rpmKey = 'openrouter:rpm';
  const dailyKey = 'openrouter:daily';
  const windowSeconds = 60;

  try {
    const dailyCount = await redis.get(dailyKey);
    if (dailyCount && parseInt(dailyCount) >= DAILY_LIMIT) {
      logger.warn(
        `Daily quota exceeded: ${dailyCount}/${DAILY_LIMIT} requests today`
      );
      return false;
    }

    const current = await redis.incr(rpmKey);
    if (current === 1) {
      await redis.expire(rpmKey, windowSeconds);
    }

    if (current > RPM_LIMIT) {
      logger.warn(
        `Rate limit exceeded: ${current}/${RPM_LIMIT} requests per minute`
      );
      return false;
    }

    logger.debug(
      `Rate check passed: ${current}/${RPM_LIMIT} RPM, ${dailyCount || 0}/${DAILY_LIMIT} daily`
    );
    return true;
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    return false;
  }
}

export async function incrementDailyCount(redis) {
  const dailyKey = 'openrouter:daily';
  const dailyResetKey = 'openrouter:daily:reset';

  try {
    const current = await redis.incr(dailyKey);

    if (current === 1) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor((tomorrow - now) / 1000);

      await redis.expire(dailyKey, secondsUntilMidnight);
      await redis.set(
        dailyResetKey,
        tomorrow.toISOString(),
        'EX',
        secondsUntilMidnight
      );

      logger.info(
        `Daily counter initialized. Resets at ${tomorrow.toISOString()}`
      );
    }

    logger.debug(`Daily requests: ${current}/${DAILY_LIMIT}`);
    return current;
  } catch (error) {
    logger.error('Error incrementing daily count:', error);
    throw error;
  }
}

export async function getRateLimitStatus(redis) {
  try {
    const [rpmCount, dailyCount, resetTime] = await Promise.all([
      redis.get('openrouter:rpm'),
      redis.get('openrouter:daily'),
      redis.get('openrouter:daily:reset'),
    ]);

    return {
      rpm: {
        current: parseInt(rpmCount) || 0,
        limit: RPM_LIMIT,
        available: Math.max(0, RPM_LIMIT - (parseInt(rpmCount) || 0)),
      },
      daily: {
        current: parseInt(dailyCount) || 0,
        limit: DAILY_LIMIT,
        available: Math.max(0, DAILY_LIMIT - (parseInt(dailyCount) || 0)),
      },
      resetTime: resetTime || null,
    };
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
}

export async function resetRateLimits(redis) {
  try {
    await redis.del(
      'openrouter:rpm',
      'openrouter:daily',
      'openrouter:daily:reset'
    );
    logger.info('Rate limits manually reset');
  } catch (error) {
    logger.error('Error resetting rate limits:', error);
    throw error;
  }
}
