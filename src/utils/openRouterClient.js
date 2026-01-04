import axios from 'axios';
import logger from '../../logger.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

const REQUEST_TIMEOUT = 45000;
const MAX_RETRIES = 2;

export async function analyzeContent(text) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.debug(`OpenRouter request attempt ${attempt}/${MAX_RETRIES}`);

      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a content moderation system.
Classify the text into ONE of these categories:

- safe: appropriate content
- hate: hate speech, discrimination
- harassment: harassment, bullying, intimidation
- sexual: explicit sexual content
- violence: explicit violence, threats

Return ONLY valid JSON with this exact format:
{
  "verdict": "safe|hate|harassment|sexual|violence",
  "confidence": 0.0
}`,
            },
            {
              role: 'user',
              content: text.slice(0, 2000),
            },
          ],
          temperature: 0,
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'X-Title': 'Beats Moderation System',
          },
          timeout: REQUEST_TIMEOUT,
        }
      );

      const content = response.data.choices[0].message.content;
      logger.debug(`OpenRouter raw response: ${content}`);

      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const result = JSON.parse(cleanContent);

      const validVerdicts = [
        'safe',
        'hate',
        'harassment',
        'sexual',
        'violence',
      ];
      if (!validVerdicts.includes(result.verdict)) {
        logger.warn(`Invalid verdict from API: ${result.verdict}`);
        return {
          verdict: 'pending',
          reason: 'invalid_response',
          rawResponse: content,
        };
      }

      const confidence =
        typeof result.confidence === 'number'
          ? result.confidence
          : parseFloat(result.confidence) || 0.0;

      logger.info(
        `Content analyzed successfully: ${result.verdict} (confidence: ${confidence})`
      );

      return {
        verdict: result.verdict,
        confidence: confidence,
        attempt: attempt,
      };
    } catch (error) {
      lastError = error;

      if (error.response?.status === 429) {
        logger.error(
          `OpenRouter rate limit exceeded (429) on attempt ${attempt}`
        );
        return {
          verdict: 'pending',
          reason: 'rate_limit_429',
          retryAfter: error.response?.headers?.['retry-after'] || null,
        };
      }

      if (error.response?.status === 402) {
        logger.error('OpenRouter quota exceeded or negative balance (402)');
        return {
          verdict: 'pending',
          reason: 'quota_exceeded',
          message: 'Daily quota exceeded or account balance negative',
        };
      }

      if (error.response?.status >= 500) {
        logger.error(
          `OpenRouter server error (${error.response.status}) on attempt ${attempt}`
        );

        if (attempt < MAX_RETRIES) {
          const backoffDelay = attempt * 2000;
          logger.warn(`Retrying after ${backoffDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        }
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        logger.error(`OpenRouter request timeout on attempt ${attempt}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
      }

      if (error instanceof SyntaxError) {
        logger.error(
          `Failed to parse OpenRouter response: ${error.message}`,
          error.response?.data
        );
        return {
          verdict: 'pending',
          reason: 'parse_error',
          rawResponse: error.response?.data,
        };
      }

      logger.error(
        `OpenRouter API error on attempt ${attempt}:`,
        error.response?.data || error.message
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  logger.error(
    'All OpenRouter attempts failed:',
    lastError?.response?.data || lastError?.message
  );

  return {
    verdict: 'pending',
    reason: 'api_error',
    error: lastError?.message || 'Unknown error',
  };
}

export async function checkAPIStatus() {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/key', {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      timeout: 10000,
    });

    logger.info('OpenRouter API key status:', response.data);
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to check OpenRouter API status:',
      error.response?.data || error.message
    );
    return null;
  }
}
