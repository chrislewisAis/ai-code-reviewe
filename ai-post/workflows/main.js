import { StateGraph, END } from '@langchain/langgraph';
import { registry } from '../agents/base.js';
import { Post } from '../models/Post.js';
import { wpClient } from '../wordpress/client.js';

const workflowState = {
  trendData: { value: null },
  pillar: { value: null }, // { topic, postId }
  clusters: { value: [] }, // Array of { topic, postId }
  linksCreated: { value: false }
};

// 1. SELECT PILLAR TOPIC (High Volume)
async function planPillar(state) {
  const agent = registry.get('pillar_topic_agent');
  const result = await agent.execute({ trend: state.trendData });
  
  const pillar = await Post.create({
    title: result.topic,
    slug: result.slug || result.topic.toLowerCase().replace(/ /g, '-'),
    content: "Pending generation...",
    type: 'pillar',
    status: 'draft'
  });

  return { pillar: { topic: result.topic, postId: pillar._id } };
}

// 2. GENERATE CLUSTERS (Low Competition Long-Tail) - MANDATORY (5-20)
async function generateClusters(state) {
  const agent = registry.get('cluster_topic_agent');
  const result = await agent.execute({ pillarTopic: state.pillar.topic });
  
  if (!result.topics || result.topics.length < 5) {
    throw new Error(`CRITICAL_FAILURE: Only ${result.topics?.length || 0} clusters generated. Minimum required: 5.`);
  }

  const clusterDocs = [];
  for (const t of result.topics.slice(0, 20)) {
    const doc = await Post.create({
      title: t.title,
      slug: t.slug,
      type: 'cluster',
      parentPostId: state.pillar.postId,
      status: 'draft'
    });
    clusterDocs.push({ topic: t.title, postId: doc._id });
  }

  // Update Pillar with Cluster IDs
  await Post.findByIdAndUpdate(state.pillar.postId, { 
    clusterIds: clusterDocs.map(c => c.postId) 
  });

  return { clusters: clusterDocs };
}

// 3. GENERATE CONTENT WITH AUTOMATED SILO LINKING
async function generateSiloContent(state) {
  const writer = registry.get('section_writer_agent');
  const linker = registry.get('internal_link_generator_agent');

  // A. Write Pillar
  let pillarContent = await writer.execute({ topic: state.pillar.topic, type: 'pillar' });
  
  // B. Write Clusters and Link to Pillar
  for (const cluster of state.clusters) {
    let content = await writer.execute({ topic: cluster.topic, type: 'cluster', parentPillar: state.pillar.topic });
    
    // STRICT RULE: Cluster MUST link to Pillar
    const internalLink = `<p>Learn more about ${state.pillar.topic} in our <a href="/${state.pillar.topic.toLowerCase().replace(/ /g, '-')}">complete guide</a>.</p>`;
    content += `\n\n${internalLink}`;
    
    await Post.findByIdAndUpdate(cluster.postId, { content, status: 'published' });
  }

  // STRICT RULE: Pillar MUST link to all Clusters
  const clusterLinksList = state.clusters.map(c => `<li><a href="/${c.topic.toLowerCase().replace(/ /g, '-')}">${c.topic}</a></li>`).join('\n');
  pillarContent += `\n\n<h3>Related Articles</h3><ul>${clusterLinksList}</ul>`;

  await Post.findByIdAndUpdate(state.pillar.postId, { content: pillarContent, status: 'published' });

  return { linksCreated: true };
}

export const mainWorkflow = new StateGraph({
  channels: workflowState,
})
  .addNode('plan_pillar', planPillar)
  .addNode('generate_clusters', generateClusters)
  .addNode('generate_content', generateSiloContent)
  .addEdge('plan_pillar', 'generate_clusters')
  .addEdge('generate_clusters', 'generate_content')
  .addEdge('generate_content', END)
  .setEntryPoint('plan_pillar')
  .compile();

