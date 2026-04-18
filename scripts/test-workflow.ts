import { workflow } from '../src/modules/orchestration/langgraph.workflow.js';
import dotenv from 'dotenv';

dotenv.config();

const samplePoisonedDiff = `
diff --git a/src/index.ts b/src/index.ts
index e69de29..cf2e269 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,22 @@
+import dbi from 'database-internal';
+
 function main() {
   console.log("Hello World");
+  
+  // Security Flaw: Hardcoded secret
+  const apiKey = "sk-live-51MzI2MzI2MzI2MzI2MzI2";
+  
+  // Performance Issue: N+1 query pattern simulation
+  const users = [1, 2, 3, 4, 5];
+  users.forEach(id => {
+    const profile = dbi.query("SELECT * FROM profiles WHERE user_id = " + id); // SQLi risk + N+1
+    console.log(profile);
+  });
+
+  // Architecture Issue: Tight coupling / circular-like reference
+  const result = eval("2 + 2"); // Execution risk
 }

 main();
+
+/* Dockerfile change for DevOps Agent */
+/* FROM node:14 */
+/* RUN npm install */
+/* COPY . . */
+/* CMD ["node", "src/index.js"] */
+`;

async function testWorkflow() {
  console.log('🧪 Starting LangGraph Workflow Test...');
  console.log('----------------------------------------');

  try {
    const result = await workflow.execute({
      diff: samplePoisonedDiff,
      orgId: 'test-org-123',
      featureFlags: {
        securityAgent: true,
        performanceAgent: true,
        architectureAgent: true,
      }
    });

    console.log('\n✅ Workflow Execution Completed!');
    console.log('\n--- AGENT FINDINGS ---');
    result.findings.forEach(agentFinding => {
      console.log(`\n🤖 Agent: ${agentFinding.agent}`);
      agentFinding.suggestions.forEach(s => {
        console.log(`  - [${s.severity.toUpperCase()}] ${s.file}:${s.line} (Confidence: ${s.confidenceScore})`);
        console.log(`    Message: ${s.message}`);
        if (s.remediation) console.log(`    Remediation: ${s.remediation}`);
      });
    });

    console.log('\n--- FINAL SUMMARY (AGGREGATOR) ---');
    console.log(result.summary);

    console.log('\n--- TOKEN USAGE ---');
    console.log(JSON.stringify(result.tokenUsage, null, 2));

  } catch (error) {
    console.error('❌ Workflow Test Failed:', error);
  }
}

testWorkflow();
