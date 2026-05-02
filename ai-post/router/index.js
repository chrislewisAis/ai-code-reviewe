import crypto from 'crypto';
import { AICache, CostLog } from '../models/System.js';
import { OpenRouterProvier, OllamaProvider, GeminiProvider, TogetherProvider, GroqProvider } from '../providers/index.js';
import modelsConfig from '../config/models.json' assert { type: 'json' };
import { logger } from '../utils/logger.js';

class AIRouter {
  constructor() {
    this.providers = {
      openrouter: new OpenRouterProvier(),
      ollama: new OllamaProvider(),
      google: new GeminiProvider(),
      together: new TogetherProvider(),
      groq: new GroqProvider()
    };
    
    // Level 8: Token Price Mapping (Price per 1M tokens)
    this.pricing = {
      'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
      'google/gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
      'meta-llama/llama-3.1-405b': { input: 2, output: 3 }
    };
  }

  async generate({ modelType, prompt, temperature, maxTokens, agentName, forceFresh = false }) {
    const chainKey = `${modelType}_chain`;
    const modelChain = modelsConfig[chainKey] || modelsConfig.writing_model_chain;
    
    // LEVEL 1: Response Cache check (before chain starts)
    const hashPayload = `${JSON.stringify(modelChain)}:${prompt}:${temperature}`;
    const cacheKey = crypto.createHash('sha256').update(hashPayload).digest('hex');

    if (!forceFresh) {
      const cached = await AICache.findOne({ key: cacheKey });
      if (cached && cached.expiresAt > new Date()) {
        logger.info(`[Router] Cache Hit`, { agentName, cacheKey });
        return cached.value;
      }
    }

    // CASCADING FAILOVER LOGIC
    for (const modelString of modelChain) {
      const [providerName, modelName] = modelString.split(':');
      const provider = this.providers[providerName];

      if (!provider) {
        logger.error(`[Router] Provider ${providerName} not configured. Skipping in chain.`);
        continue;
      }

      // FREE TIER STAGGERING: Add a small random delay to prevent parallel bursts
      if (!modelString.includes('ollama')) {
        const staggerDelay = Math.random() * 1500; 
        await new Promise(r => setTimeout(r, staggerDelay));
      }

      let retries = 2; // Internal retries per model in the chain
      while (retries > 0) {
        try {
          logger.info(`[Router] Attempting ${modelString}`, { agentName, retry: 3 - retries });
          const result = await provider.generate({ model: modelName, prompt, temperature, maxTokens });

          // Log costs for this specific successful model
          const price = this.pricing[modelName] || { input: 0.5, output: 1.5 };
          const costUSD = ((result.usage.prompt_tokens / 1000000) * price.input) + 
                          ((result.usage.completion_tokens / 1000000) * price.output);

          await CostLog.create({
            agentName,
            model: modelString,
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
            cost: costUSD,
            timestamp: new Date()
          });

          // Cache the successful result
          await AICache.findOneAndUpdate(
            { key: cacheKey },
            { value: result.text, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            { upsert: true }
          );

          return result.text;
        } catch (error) {
          logger.warn(`[Router] Error with ${modelString}: ${error.message}`, { agentName });
          retries--;
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 1500)); // Short pause before internal retry
          }
        }
      }

      logger.error(`[Router] ${modelString} exhausted. Moving to next in chain...`);
    }

    throw new Error(`CRITICAL_ROUTER_FAILURE: All models in the ${modelType} chain failed.`);
  }

}


export const router = new AIRouter();
