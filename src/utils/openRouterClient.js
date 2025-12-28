// src/utils/openRouterClient.js
import axios from 'axios';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function analyzeContent(text) {
  const res = await axios.post(
    OPENROUTER_URL,
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un sistema de moderación de contenido. Clasifica el contenido como: safe, hate, harassment, sexual, violence.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    }
  );

  return res.data.choices[0].message.content;
}
