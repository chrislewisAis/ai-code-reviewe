import { StateGraph, START, END } from '@langchain/langgraph';
import { WorkflowState } from './agents/types.js';
import { qualityAgent } from './agents/quality.agent.js';
import { securityAgent } from './agents/security.agent.js';
import { performanceAgent } from './agents/performance.agent.js';
import { architectureAgent } from './agents/architecture.agent.js';
import { devopsAgent } from './agents/devops.agent.js';
import { aggregatorNode } from './agents/aggregator.node.js';

// 4. Construct Graph
const graphBuilder = new StateGraph<WorkflowState>({
  channels: {
    diff: { value: (x, y) => x ?? y },
    orgId: { value: (x, y) => x ?? y },
    featureFlags: { value: (x, y) => x ?? y },
    findings: { value: (x, y) => [...(x ?? []), ...(y ?? [])], default: () => [] },
    summary: { value: (x, y) => y ?? x },
    tokenUsage: { 
      value: (x, y) => ({
        promptTokens: (x?.promptTokens ?? 0) + (y?.promptTokens ?? 0),
        completionTokens: (x?.completionTokens ?? 0) + (y?.completionTokens ?? 0),
        totalTokens: (x?.totalTokens ?? 0) + (y?.totalTokens ?? 0),
      }),
      default: () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0 })
    }
  }
})
  .addNode("quality", qualityAgent as any)
  .addNode("security", securityAgent as any)
  .addNode("performance", performanceAgent as any)
  .addNode("architecture", architectureAgent as any)
  .addNode("devops", devopsAgent as any)
  .addNode("aggregator", aggregatorNode as any)
  .addEdge(START, "quality")
  .addEdge(START, "security")
  .addEdge(START, "performance")
  .addEdge(START, "architecture")
  .addEdge(START, "devops")
  .addEdge("quality", "aggregator")
  .addEdge("security", "aggregator")
  .addEdge("performance", "aggregator")
  .addEdge("architecture", "aggregator")
  .addEdge("devops", "aggregator")
  .addEdge("aggregator", END);

export const workflow = {
  execute: async (input: { diff: string, orgId: string, featureFlags: any }): Promise<WorkflowState> => {
    const app = graphBuilder.compile();
    const result = await app.invoke({
      ...input,
      findings: [],
      summary: '',
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    });
    return result as any as WorkflowState;
  }
};
