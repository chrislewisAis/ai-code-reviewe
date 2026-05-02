import axios from 'axios';

export class BaseProvider {
  constructor(config) {
    this.config = config;
  }
  async generate(params) {
    throw new Error('Method not implemented');
  }
}

export class OpenRouterProvier extends BaseProvider {
  async generate({ model, prompt, temperature = 0.7, maxTokens = 2000 }) {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ai-blog-factory.com',
        'X-Title': 'AI Blog Factory'
      }
    });

    const data = response.data.choices[0].message;
    return {
      text: data.content,
      usage: response.data.usage
    };
  }
}

export class TogetherProvider extends BaseProvider {
  async generate({ model, prompt, temperature = 0.7, maxTokens = 2000 }) {
    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    }, {
      headers: { 'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}` }
    });
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  }
}

export class OllamaProvider extends BaseProvider {
  async generate({ model, prompt, temperature = 0.7 }) {
    try {
      const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: { temperature }
      });
      return {
        text: response.data.response,
        usage: { prompt_tokens: 0, completion_tokens: 0 } 
      };
    } catch (e) {
      throw new Error(`Ollama Local Offline: ${e.message}`);
    }
  }
}
export class GeminiProvider extends BaseProvider {
  async generate({ model, prompt, temperature = 0.7 }) {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature }
    });
    return {
      text: response.data.candidates[0].content.parts[0].text,
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    };
  }
}

export class GroqProvider extends BaseProvider {
  async generate({ model, prompt, temperature = 0.7, maxTokens = 2000 }) {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    });
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  }
}
