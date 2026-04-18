import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState, parser } from './types.js';

export const performanceAgent = async (state: WorkflowState) => {
  if (!state.featureFlags.performanceAgent) return { findings: [] };
  
  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Performance Engineer and Backend Architect. Your role is to analyze the following code diff for performance bottlenecks, inefficient resource usage, and scalability issues.\n\n" +
    "Focus Areas:\n" +
    "- Computational complexity (Big O) and inefficient loops.\n" +
    "- N+1 query patterns and database/API call optimization.\n" +
    "- Memory leaks and synchronization/locking overhead.\n" +
    "- Blocking operations in asynchronous code paths.\n\n" +
    "Constraint:\n" +
    "- Provide concise code snippets for remediations only when necessary. Avoid large rewrites.\n" +
    "- Assign a confidence score (0-1) to each finding.\n" +
    "- Focus on metrics that impact latency, throughput, and resource costs.\n\n" +
    "Diff:\n{diff}\n\n{format_instructions}"
  );
  
  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    diff: state.diff,
    format_instructions: parser.getFormatInstructions()
  });

  return {
    findings: [{ agent: 'Performance', suggestions: result.suggestions }]
  };
};
