import { registry, BaseAgent } from './base.js';
import { categoryPrompts, apiAgentLogic, GLOBAL_CONSTRAINTS } from './prompts.js';

let isInitialized = false;

class ProductionAgent extends BaseAgent {
  constructor(name, category) {
    const config = categoryPrompts[category] || categoryPrompts.WRITING;
    super(name, config.system, ProductionAgent.determineModel(category));
    this.category = category;
    this.requirements = config.requirements;
    this.logic = apiAgentLogic[name] || 'Execute standard operational procedure for this category.';
  }

  static determineModel(category) {
    if (['TREND', 'COMPETITOR', 'KEYWORD'].includes(category)) return 'research_model';
    if (['QUALITY', 'WORDPRESS', 'OPTIMIZATION'].includes(category)) return 'analysis_model';
    return 'writing_model';
  }

  formatPrompt(input) {
    return `
### [CORE SYSTEM ROLE]
${this.description}

### [GLOBAL OPERATIONAL CONSTRAINTS]
${GLOBAL_CONSTRAINTS}

### [EXECUTION LOGIC & STEPS]
${this.logic}

### [SPECIFIC FIELD REQUIREMENTS]
${this.requirements.map(r => `- ${r}`).join('\n')}

### [INPUT DATA PAYLOAD]
${JSON.stringify(input, null, 2)}

### [OUTPUT INSTRUCTIONS]
1. [THINKING PHASE]: Before providing the final answer, briefly outline your reasoning process.
2. [EXECUTION PHASE]: Provide the results following all constraints.
3. [FORMAT]: Returns MUST be JSON-wrapped if technical, or clean Markdown if content.
`;
  }

  parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { content: response };
    } catch (e) {
      return { raw: response, error: "JSON_PARSE_FAILED" };
    }
  }
}

const categories = {
  TREND: [
    'reddit_topic_extractor_agent', 'reddit_subreddit_trend_agent', 'reddit_comment_sentiment_agent', 'reddit_keyword_signal_agent',
    'twitter_hashtag_trend_agent', 'twitter_engagement_analyzer_agent', 'twitter_topic_velocity_agent', 'twitter_influencer_signal_agent',
    'google_trends_spike_detector_agent', 'google_trends_seasonality_agent', 'google_trends_region_agent', 'google_trends_comparison_agent',
    'youtube_viral_topic_agent', 'youtube_title_pattern_agent', 'youtube_engagement_ratio_agent', 'youtube_trend_forecaster_agent',
    'producthunt_trending_agent', 'producthunt_category_agent', 'producthunt_growth_signal_agent', 'producthunt_launch_pattern_agent'
  ],
  COMPETITOR: [
    'serp_top10_scraper_agent', 'serp_position_tracker_agent', 'serp_featured_snippet_agent', 'serp_people_also_ask_agent',
    'competitor_content_scraper_agent', 'competitor_structure_analyzer_agent', 'competitor_wordcount_agent', 'competitor_heading_agent',
    'content_gap_detector_agent', 'topic_overlap_analyzer_agent', 'content_depth_comparator_agent', 'content_uniqueness_agent',
    'keyword_gap_detector_agent', 'keyword_overlap_agent', 'keyword_difficulty_agent', 'keyword_opportunity_agent',
    'backlink_profile_agent', 'domain_authority_agent', 'traffic_estimator_agent', 'competitor_publish_frequency_agent'
  ],
  KEYWORD: [
    'keyword_extractor_agent', 'long_tail_keyword_agent', 'question_keyword_agent', 'semantic_keyword_agent',
    'keyword_cluster_agent', 'topic_cluster_agent', 'keyword_grouping_agent', 'intent_cluster_agent',
    'search_intent_classifier_agent', 'transactional_intent_agent', 'informational_intent_agent', 'navigational_intent_agent',
    'keyword_priority_agent', 'keyword_score_agent', 'keyword_roi_agent', 'keyword_trend_score_agent',
    'keyword_density_agent', 'lsi_keyword_agent', 'keyword_variation_agent', 'keyword_cannibalization_agent'
  ],
  P_SEO: [
    'template_generator_agent', 'dynamic_template_agent', 'content_template_optimizer_agent', 'template_variation_agent',
    'topic_expansion_agent', 'subtopic_generator_agent', 'usecase_expansion_agent', 'audience_expansion_agent',
    'page_generator_agent', 'slug_generator_agent', 'title_generator_agent', 'headline_variation_agent',
    'pagination_agent', 'category_page_generator_agent', 'tag_page_generator_agent', 'landing_page_generator_agent',
    'programmatic_scaling_agent', 'content_batch_planner_agent', 'seo_structure_agent', 'url_structure_agent'
  ],
  WRITING: [
    'outline_generator_agent', 'outline_refiner_agent', 'section_planner_agent', 'introduction_writer_agent',
    'hook_generator_agent', 'storytelling_agent', 'tone_adjustment_agent', 'section_writer_agent',
    'paragraph_expander_agent', 'example_generator_agent', 'usecase_writer_agent', 'table_generator_agent',
    'comparison_table_agent', 'pros_cons_generator_agent', 'statistics_generator_agent', 'data_integration_agent',
    'fact_inserter_agent', 'faq_generator_agent', 'question_generator_agent', 'answer_writer_agent',
    'conclusion_writer_agent', 'summary_generator_agent', 'cta_generator_agent'
  ],
  QUALITY: [
    'fact_checker_agent', 'source_validator_agent', 'hallucination_detector_agent', 'readability_improver_agent',
    'grammar_corrector_agent', 'sentence_simplifier_agent', 'seo_optimizer_agent', 'keyword_insertion_agent',
    'meta_optimizer_agent', 'duplicate_content_detector_agent', 'plagiarism_checker_agent', 'content_uniqueness_agent',
    'style_consistency_agent', 'tone_consistency_agent', 'structure_validator_agent'
  ],
  DNA: [
    'definition_block_agent', 'intro_block_agent', 'benefits_block_agent', 'features_block_agent',
    'comparison_block_agent', 'pros_cons_block_agent', 'usecase_block_agent', 'examples_block_agent',
    'faq_block_agent', 'question_block_agent', 'answer_block_agent', 'statistics_block_agent',
    'data_block_agent', 'cta_block_agent', 'summary_block_agent'
  ],
  GRAPH: [
    'entity_extractor_agent', 'entity_normalizer_agent', 'entity_deduplicator_agent', 'relation_extractor_agent',
    'relation_classifier_agent', 'relation_ranker_agent', 'knowledge_graph_builder_agent', 'graph_storage_agent',
    'graph_optimizer_agent', 'topic_entity_mapper_agent', 'content_entity_linker_agent', 'entity_context_agent',
    'semantic_relationship_agent', 'ontology_builder_agent', 'graph_query_agent'
  ],
  LINKING: [
    'internal_link_generator_agent', 'contextual_link_agent', 'anchor_text_generator_agent', 'anchor_variation_agent',
    'link_priority_agent', 'link_relevance_agent', 'topic_cluster_linker_agent', 'pillar_cluster_linker_agent',
    'cross_cluster_linker_agent', 'orphan_page_detector_agent', 'link_distribution_agent', 'link_depth_agent',
    'silo_structure_agent', 'navigation_link_agent', 'breadcrumb_generator_agent'
  ],
  WORDPRESS: [
    'wordpress_post_creator_agent', 'wordpress_post_updater_agent', 'wordpress_scheduler_agent', 'wordpress_media_uploader_agent',
    'image_optimizer_agent', 'alt_text_generator_agent', 'wordpress_metadata_agent', 'meta_title_agent',
    'meta_description_agent', 'slug_optimizer_agent', 'category_assign_agent', 'tag_generator_agent',
    'wordpress_status_manager_agent', 'wordpress_auth_agent', 'wordpress_api_retry_agent'
  ],
  UPDATE: [
    'ranking_monitor_agent', 'keyword_position_tracker_agent', 'traffic_monitor_agent', 'content_decay_detector_agent',
    'freshness_score_agent', 'trend_revival_agent', 'content_refresh_agent', 'section_updater_agent',
    'data_updater_agent', 'content_expansion_agent', 'subtopic_inserter_agent', 'faq_expander_agent',
    'competitor_update_tracker_agent', 'update_priority_agent', 'republish_agent'
  ],
  OPTIMIZATION: [
    'prompt_cache_agent', 'response_cache_agent', 'cache_invalidator_agent', 'embedding_generator_agent',
    'semantic_search_agent', 'similarity_match_agent', 'content_reuse_agent', 'block_reuse_agent',
    'cost_tracker_agent', 'token_usage_agent'
  ],
  SCHEDULER: [
    'cron_scheduler_agent', 'daily_pipeline_agent', 'batch_execution_agent', 'queue_dispatcher_agent',
    'job_retry_agent', 'failure_handler_agent', 'workflow_orchestrator_agent', 'pipeline_monitor_agent',
    'execution_logger_agent', 'alerting_agent'
  ]
};

export function initAgents() {
  if (isInitialized) return registry;

  Object.entries(categories).forEach(([catKey, agents]) => {
    agents.forEach(name => {
      registry.register(new ProductionAgent(name, catKey));
    });
  });

  isInitialized = true;
  console.log(`[Agents] Initialized ${registry.agents.size} enterprise-grade agents with CoT logic.`);
  return registry;
}
