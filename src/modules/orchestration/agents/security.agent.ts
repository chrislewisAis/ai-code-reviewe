import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState, parser } from './types.js';

export const securityAgent = async (state: WorkflowState) => {
  if (!state.featureFlags.securityAgent) return { findings: [] };
  
  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Senior Security Engineer and Penetration Tester. Your role is to analyze the following code diff for security vulnerabilities, sensitive data exposure, and insecure coding patterns (OWASP Top 10).\n\n" +
    "Focus Areas:\n" +
    "- Injection attacks (SQLi, XSS, Command Injection).\n" +
    "- Broken authentication and authorization logic.\n" +
    "- Sensitive data exposure (leaked secrets, unencrypted PII).\n" +
    "- Insecure use of external libraries or APIs.\n\n" +
    "Constraint:\n" +
    "- Provide concise code snippets for remediations only when necessary. Avoid large rewrites.\n" +
    "- Assign a confidence score (0-1) to each finding.\n" +
    "- BE SKEPTICAL. Validate every input and trust boundary.\n\n" +
    "Diff:\n{diff}\n\n{format_instructions}"
  );
  
  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    diff: state.diff,
    format_instructions: parser.getFormatInstructions()
  });

  return {
    findings: [{ agent: 'Security', suggestions: result.suggestions }]
  };
};
