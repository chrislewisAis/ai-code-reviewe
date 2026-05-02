import { ContentDNA } from '../models/ContentDNA.js';
import { router } from '../router/index.js';

export class ContentDNAService {
  static async getBlock(entity, category) {
    const block = await ContentDNA.findOne({ entity, category });
    if (block) {
      console.log(`[DNA] Reusing block for ${entity}:${category}`);
      await ContentDNA.updateOne({ _id: block._id }, { $inc: { usageCount: 1 } });
      return block.content;
    }
    return null;
  }

  static async storeBlock(entity, category, content, source = 'ai-generation') {
    // Generate embedding for similarity search (optional, simplified here)
    const embedding = []; // Real implementation would call embedding model
    
    return ContentDNA.create({
      entity,
      category,
      content,
      embedding,
      source
    });
  }

  static async findSimilar(query, category) {
    // This would use MongoDB Atlas Vector Search in production
    // For now, simple text search fallback
    return ContentDNA.find({ 
      category,
      $text: { $search: query } 
    }).limit(3);
  }
}

export class InternalLinkingService {
  static async suggestLinks(postContent, relatedPosts) {
    const agent = registry.get('internal_link_generator_agent');
    return agent.execute({ content: postContent, availablePosts: relatedPosts });
  }

  static generateAnchor(text, url) {
    return `<a href="${url}">${text}</a>`;
  }
}
