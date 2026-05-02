import { router } from '../router/index.js';
import { ContentDNAService } from '../utils/seo-utils.js';
import { logger, createTraceId } from '../utils/logger.js';
import { Post } from '../models/Post.js';
import crypto from 'crypto';

export class BaseAgent {
  constructor(name, description, modelType = 'writing_model') {
    this.name = name;
    this.description = description;
    this.modelType = modelType;
  }

  async execute(input, traceId = createTraceId()) {
    const startTime = Date.now();
    logger.info(`[Agent:${this.name}] Starting execution`, { traceId, input });

    // LEVEL 6: Deduplication Check (For content articles)
    if (this.category === 'writing' && input.topic) {
      const existing = await Post.findOne({ title: new RegExp(input.topic, 'i') });
      if (existing) {
        logger.warn(`[CostOpt] LEVEL 6 HIT: Article already exists for ${input.topic}. Skipping.`, { traceId });
        return existing;
      }
    }

    try {
      // LEVEL 2 & 3: DNA & Embedding Check
      if (input.entity && input.category) {
        const dnaBlock = await ContentDNAService.getBlock(input.entity, input.category);
        if (dnaBlock) {
          logger.info(`[CostOpt] LEVEL 2 HIT: DNA Reused`, { traceId, entity: input.entity });
          return dnaBlock;
        }
      }

      const prompt = this.formatPrompt(input);
      const response = await router.generate({
        modelType: this.modelType,
        prompt,
        temperature: Number(process.env.DEFAULT_TEMP || 0.7),
        agentName: this.name,
        traceId // Pass traceId for cross-system correlation
      });

      const result = this.parseResponse(response);
      
      const duration = Date.now() - startTime;
      logger.info(`[Agent:${this.name}] Completed`, { traceId, durationMs: duration });

      return result;
    } catch (error) {
      logger.error(`[Agent:${this.name}] Failed`, { traceId, error: error.message });
      throw error;
    }
  }

  generateHash(input) {
    return Buffer.from(JSON.stringify(input)).toString('base64').substring(0, 32);
  }

  formatPrompt(input) {
    return `Agent: ${this.name}\nContext: ${JSON.stringify(input)}`;
  }

  parseResponse(response) {
    return response;
  }
}


class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  register(agent) {
    this.agents.set(agent.name, agent);
  }

  get(name) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent ${name} not found`);
    return agent;
  }
}

export const registry = new AgentRegistry();
