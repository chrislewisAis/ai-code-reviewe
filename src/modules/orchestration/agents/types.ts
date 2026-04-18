import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

export interface AgentFinding {
  agent: string;
  suggestions: Array<{
    file: string;
    line: number;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    confidenceScore: number; // 0 to 1
    remediation?: string; // Optional concise code snippet or instruction
  }>;
}

export interface WorkflowState {
  diff: string;
  orgId: string;
  featureFlags: any;
  findings: AgentFinding[];
  summary: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const findingSchema = z.object({
  suggestions: z.array(z.object({
    file: z.string(),
    line: z.number(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    confidenceScore: z.number().min(0).max(1),
    remediation: z.string().optional()
  }))
});

export const parser = StructuredOutputParser.fromZodSchema(findingSchema);
