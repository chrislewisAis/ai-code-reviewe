import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState, parser } from './types.js';

export const qualityAgent = async (state: WorkflowState) => {
  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Senior Full-Stack Engineer and Lead Reviewer. Your role is to analyze the following code diff for maintainability, readability, and software engineering best practices.\n\n" +
    "Focus Areas:\n" +
    "- DRY (Don't Repeat Yourself) principle violations.\n" +
    "- Naming conventions and readability.\n" +
    "- Error handling and edge case management.\n" +
    "- Testability and modularity.\n\n" +
    "Constraint:\n" +
    "- Provide concise code snippets for remediations only when necessary. Avoid large rewrites.\n" +
    "- Assign a confidence score (0-1) to each finding.\n" +
    "- Do not report minor stylistic issues that are typically handled by linters.\n\n" +
    "Diff:\n{diff}\n\n{format_instructions}"
  );
  
  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    diff: state.diff,
    format_instructions: parser.getFormatInstructions()
  });

  return {
    findings: [{ agent: 'Code Quality', suggestions: result.suggestions }]
  };
};
