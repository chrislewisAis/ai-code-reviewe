import { ChatOpenAI } from '@langchain/openai';
import { config } from '../../config/index.js';

export class LLMGateway {
  private static instance: LLMGateway;
  private primaryModel: ChatOpenAI;

  private constructor() {
    if (!config.openrouter.apiKey) {
      throw new Error('LLMGateway Error: OPENROUTER_API_KEY is not defined in environment');
    }

    this.primaryModel = new ChatOpenAI({
      apiKey: config.openrouter.apiKey,
      modelName: config.openrouter.defaultModel,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });
  }

  public static getInstance(): LLMGateway {
    if (!LLMGateway.instance) {
      LLMGateway.instance = new LLMGateway();
    }
    return LLMGateway.instance;
  }

  getModel(modelName?: string) {
    if (!modelName || modelName === config.openrouter.defaultModel) {
      return this.primaryModel;
    }

    return new ChatOpenAI({
      apiKey: config.openrouter.apiKey,
      modelName,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });
  }
}

export const llmGateway = LLMGateway.getInstance();
