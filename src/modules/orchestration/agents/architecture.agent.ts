import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState, parser } from './types.js';

export const architectureAgent = async (state: WorkflowState) => {
  if (!state.featureFlags.architectureAgent) return { findings: [] };
  
  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Software Architect and Systems Design Expert. Your role is to analyze the following code diff for structural integrity, design pattern adherence, and modular boundaries.\n\n" +
    "Focus Areas:\n" +
    "- Adherence to SOLID principles and Clean Architecture.\n" +
    "- Detection of circular dependencies and tight coupling.\n" +
    "- Proper separation of concerns (e.g., Domain logic vs. Infrastructure).\n" +
    "- API contract consistency and modularity.\n\n" +
    "Constraint:\n" +
    "- Provide concise code snippets for remediations only when necessary. Avoid large rewrites.\n" +
    "- Assign a confidence score (0-1) to each finding.\n" +
    "- Focus on long-term maintainability and system-wide impact.\n\n" +
    "Diff:\n{diff}\n\n{format_instructions}"
  );
  
  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    diff: state.diff,
    format_instructions: parser.getFormatInstructions()
  });

  return {
    findings: [{ agent: 'Architecture', suggestions: result.suggestions }]
  };
};
