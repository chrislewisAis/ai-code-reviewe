import { PromptTemplate } from '@langchain/core/prompts';
import { llmGateway } from '../../ai/llm.gateway.js';
import { WorkflowState, parser } from './types.js';

export const devopsAgent = async (state: WorkflowState) => {
  // Conditional check: only run if relevant DevOps files are in the diff
  const devopsFiles = ['Dockerfile', 'docker-compose.yml', '.github/workflows'];
  const hasDevopsChanges = devopsFiles.some(file => state.diff.includes(file));

  if (!hasDevopsChanges) {
    return { findings: [] };
  }

  const model = llmGateway.getModel();
  const prompt = PromptTemplate.fromTemplate(
    "You are a Senior SRE and DevOps Engineer. Your role is to analyze the following code diff for infrastructure-related issues, CI/CD best practices, and security vulnerabilities in containerization configurations.\n\n" +
    "Focus Areas:\n" +
    "- Dockerfile security (non-root users, pinning versions, multi-stage builds).\n" +
    "- docker-compose best practices (networks, volumes, resource limits).\n" +
    "- CI/CD workflow efficiency and security (secret management, job optimization).\n\n" +
    "Constraint:\n" +
    "- Provide concise code snippets for remediations only when necessary. Avoid large rewrites.\n" +
    "- Assign a confidence score (0-1) to each finding.\n\n" +
    "Diff:\n{diff}\n\n{format_instructions}"
  );
  
  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    diff: state.diff,
    format_instructions: parser.getFormatInstructions()
  });

  return {
    findings: [{ agent: 'DevOps & Infrastructure', suggestions: result.suggestions }]
  };
};
