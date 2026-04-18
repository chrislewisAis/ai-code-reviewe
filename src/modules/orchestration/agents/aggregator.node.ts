import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState } from './types.js';

export const aggregatorNode = async (state: WorkflowState) => {
  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Strategic Code Reviewer and Tech Lead. Your role is to synthesize findings from multiple specialized agents (Quality, Security, Performance, Architecture, DevOps) and provide a professional, actionable summary for a GitHub PR.\n\n" +
    "Inputs:\n" +
    "- Specialized Findings: {findings}\n\n" +
    "Task:\n" +
    "1. Filter and Prioritize: Focus on high-confidence, critical results. Remove redundant or contradictory suggestions.\n" +
    "2. Synthesis: Group similar issues across different agents if they point to the same root cause.\n" +
    "3. Summary: Provide a high-level verdict (e.g., 'Ready for merge but with minor improvements', or 'Critical issues detected').\n" +
    "4. Formatting: Use clear headers, bullet points, and highlight critical issues with bold text.\n\n" +
    "Constraints:\n" +
    "- Include confidence scores in the detailed breakdown if they are notably low (< 0.7).\n" +
    "- Keep the tone professional, direct, and supportive.\n\n" +
    "Output must be a developer-friendly markdown report."
  );
  
  const result = await model.invoke(await prompt.format({
    findings: JSON.stringify(state.findings, null, 2)
  }));

  const usage = (result as any).response_metadata?.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  return {
    summary: result.content.toString(),
    tokenUsage: usage
  };
};
