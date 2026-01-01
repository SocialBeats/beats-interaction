import axios from 'axios';
import logger from '../../logger.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

export async function analyzeContent(text) {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `
                      Eres un sistema de moderación de contenido.
                      Clasifica el texto en UNA de estas categorías:

                      - safe
                      - hate
                      - harassment
                      - sexual
                      - violence

                      Devuelve SOLO JSON con este formato exacto:
                      {
                        "verdict": "safe|hate|harassment|sexual|violence",
                        "confidence": 0.0
                      }
                      `,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;
    const result = JSON.parse(content);

    const validVerdicts = ['safe', 'hate', 'harassment', 'sexual', 'violence'];
    if (!validVerdicts.includes(result.verdict)) {
      throw new Error(`Invalid verdict: ${result.verdict}`);
    }

    return result;
  } catch (error) {
    logger.error('Error analyzing content:', error.message);
    return { verdict: 'pending', reason: 'api_error' };
  }
}
