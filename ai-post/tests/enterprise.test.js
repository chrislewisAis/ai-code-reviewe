import { registry } from './agents/base.js';
import { logger } from './utils/logger.js';

describe('AI Blog Factory - MCN Grade Production Testing', () => {
  
  beforeAll(async () => {
    // Import initAgents to populate registry
    const { initAgents } = await import('../agents/factory.js');
    initAgents();
  });

  test('Registry should contain all 208 specialized agents', () => {
    expect(registry.agents.size).toBeGreaterThanOrEqual(208);
  });

  test('Agent Prompts should follow the Enterprise Modular format', () => {
    const agent = registry.get('pillar_topic_agent');
    const prompt = agent.formatPrompt({ trend: 'test' });
    
    expect(prompt).toContain('[CORE SYSTEM ROLE]');
    expect(prompt).toContain('[GLOBAL OPERATIONAL CONSTRAINTS]');
    expect(prompt).toContain('[THINKING PHASE]');
  });

  test('Base Agent should correctly handle the "Thinking Phase" preamble in responses', () => {
    const agent = registry.get('section_writer_agent');
    const mockResponse = "Thinking: I should write a hook.\n\n```json\n{\"content\": \"Success\"}\n```";
    const parsed = agent.parseResponse(mockResponse);
    
    expect(parsed.content).toBe('Success');
  });

});
