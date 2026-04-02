export type AgentId =
  | 'orchestrator'
  | 'clinical'
  | 'social'
  | 'scheduler'
  | 'commerce'
  | 'cfo'
  | 'design';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  nickname: string;
  role: string;
  job: string;
  responsibilities: string[];
  requiredSkills: string[];
  inputs: string[];
  outputs: string[];
  routing: {
    receivesFrom: AgentId[];
    sendsTo: AgentId[];
  };
  dataContract: {
    expects: string;
    provides: string;
  };
  successMetric?: string;
}

export const agentSwarm: AgentDefinition[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    nickname: 'The Brain',
    role: 'Entry point & project manager',
    job: 'Owns the research session lifecycle, decomposes user intent into sub tasks, and synthesizes the final dashboard summary.',
    responsibilities: [
      'Ingest natural-language goals from Ali and convert them into structured sub-briefs.',
      'Dispatch atomic work items to the six specialist agents and monitor completion state.',
      'Merge structured JSON payloads from every downstream agent into a single "Protocol Summary" object for the UI.',
      'Escalate conflicts or missing data back to the user for clarification.'
    ],
    requiredSkills: ['task_router', 'context_window_guard'],
    inputs: [
      'User prompts describing supplements, objectives, or constraints',
      'Historical protocol context (if provided)',
      'Completion receipts emitted by downstream agents'
    ],
    outputs: [
      'Structured task queue dispatched to specific agents',
      'Final summary JSON: { science, sentiment, schedule, commerce, cost, uiHints }'
    ],
    routing: {
      receivesFrom: ['clinical', 'social', 'scheduler', 'commerce', 'cfo', 'design'],
      sendsTo: ['clinical', 'social', 'scheduler', 'commerce', 'cfo', 'design']
    },
    dataContract: {
      expects: 'High-level intent with optional biometrics + stack items',
      provides: 'Single merged protocol payload ready for UI rendering'
    },
    successMetric: 'All child tasks completed & reconciled before summary emission'
  },
  {
    id: 'clinical',
    name: 'Clinical-Agent',
    nickname: 'The Scientist',
    role: 'Medical & biochemical research',
    job: 'Query primary literature, compute mg/kg dosages, and flag medical caveats.',
    responsibilities: [
      'Use web_search + pubmed-edirect to pull peer-reviewed evidence and NIH data.',
      'Derive dosage ranges using mg/kg formulas that adjust for the user’s weight/age.',
      'Enumerate contraindications, drug interactions, and side-effect incidence rates.',
      'Emit normalized evidence summaries with citations for attachment to the dashboard.'
    ],
    requiredSkills: ['web_search', 'pubmed-edirect', 'units_math'],
    inputs: [
      'Supplement target(s)',
      'Biometric context (weight, age, sex assigned at birth)',
      'Existing stack conflicts from Scheduler-Pro (optional)'
    ],
    outputs: [
      'science.findings[]: peer-reviewed claims with PMID references',
      'dosage.mg_per_kg + recommended daily total',
      'clinical_alerts[]: interaction + severity metadata'
    ],
    routing: {
      receivesFrom: ['orchestrator'],
      sendsTo: ['orchestrator', 'scheduler']
    },
    dataContract: {
      expects: 'Target molecule + biometric payload',
      provides: 'Evidence pack JSON + dosage math + interaction flags'
    },
    successMetric: 'All claims backed by citations; dosage computed for provided biometrics'
  },
  {
    id: 'social',
    name: 'Social-Agent',
    nickname: 'The Curator',
    role: 'Real-world sentiment analysis',
    job: 'Summarize public sentiment from influencers and reviews, filtering hype from lived experience.',
    responsibilities: [
      'Parse long-form audio/video transcripts (Huberman, Attia, etc.) for protocol mentions.',
      'Ingest Amazon and community reviews to build a balanced sentiment profile.',
      'Highlight experiential insights (dream vividness, taste complaints, cycling advice).',
      'Tag each anecdote with source + reliability to aid downstream decisions.'
    ],
    requiredSkills: ['youtube-transcripts', 'amazon-review-nlp'],
    inputs: ['Supplement focus from Orchestrator'],
    outputs: [
      'sentiment.summary',
      'sentiment.positives[] / negatives[] with frequency counts',
      'anecdote.highlights[] tagged by source'
    ],
    routing: {
      receivesFrom: ['orchestrator'],
      sendsTo: ['orchestrator', 'scheduler']
    },
    dataContract: {
      expects: 'Canonical supplement name + influencer/review handles (optional)',
      provides: 'Weighted sentiment bundle with qualitative quotes'
    },
    successMetric: 'At least one verified quote per sentiment bucket'
  },
  {
    id: 'scheduler',
    name: 'Scheduler-Pro',
    nickname: 'The Clock',
    role: 'Conflict resolution & timing',
    job: 'Owns the AM/PM stack, ensuring antagonistic absorption issues are avoided.',
    responsibilities: [
      'Maintain the master supplement timeline with meal context and spacing rules.',
      'Detect antagonistic pairs (e.g., Zinc vs. Magnesium) using supplement-rules.json.',
      'Resolve conflicts by re-ordering or recommending buffers and co-factors.',
      'Emit daypart payloads for rendering in the Scheduler view.'
    ],
    requiredSkills: ['timeline_planner', 'conflict_resolver'],
    inputs: [
      'Stack inventory from user',
      'Clinical alerts (contraindications, stomach metrics)',
      'Sentiment hints about tolerability'
    ],
    outputs: [
      'schedule.blocks[] with time, context note, and caution flags',
      'conflict_log[] referencing supplement-rules entries'
    ],
    routing: {
      receivesFrom: ['orchestrator', 'clinical', 'social'],
      sendsTo: ['orchestrator', 'design']
    },
    dataContract: {
      expects: 'List of supplements + any fixed user routines',
      provides: 'Ordered AM/PM timeline + conflict annotations'
    },
    successMetric: 'Zero unhandled antagonistic pairs in final schedule'
  },
  {
    id: 'commerce',
    name: 'Commerce-Agent',
    nickname: 'The Shopper',
    role: 'Price optimization & affiliate enforcement',
    job: 'Fetch the best price per SKU across vetted retailers while preserving Ali’s affiliate tag.',
    responsibilities: [
      'Query multiple storefront APIs/pages and normalize price per unit.',
      'Return only purchase links that append ?tag=ali-20 (or supplied affiliate param).',
      'Flag out-of-stock or counterfeit risks.',
      'Emit monetization notes for upsells/bundle suggestions.'
    ],
    requiredSkills: ['commerce-scraper', 'affiliate-linker'],
    inputs: ['SKU list + preferred retailers from Orchestrator'],
    outputs: [
      'commerce.bestPrice { retailer, price, savings, affiliateLink }',
      'commerce.alternatives[] with ETA/stock meta'
    ],
    routing: {
      receivesFrom: ['orchestrator'],
      sendsTo: ['orchestrator', 'design']
    },
    dataContract: {
      expects: 'Standardized SKU descriptors + affiliate tag string',
      provides: 'Price comparison table + guaranteed affiliate-safe links'
    },
    successMetric: '≥1 affiliate-compliant link per SKU'
  },
  {
    id: 'cfo',
    name: 'CFO-Agent',
    nickname: 'The Accountant',
    role: 'Token & ROI monitoring',
    job: 'Track API spend per protocol session and surface profitability guidance.',
    responsibilities: [
      'Log token/credit usage for OpenRouter, Gemini, and other paid endpoints.',
      'Attribute costs to each child agent task to show all-in research spend.',
      'Estimate affiliate revenue or subscription value to compute ROI.',
      'Alert when projected margin falls below a configurable threshold.'
    ],
    requiredSkills: ['usage-ledger', 'roi-modeler'],
    inputs: [
      'Task completion metadata (model, tokens, duration)',
      'Commerce-agent projected revenue'
    ],
    outputs: [
      'finance.runRate { tokensUsed, usdCost }',
      'finance.roiEstimate { revenuePotential, margin }',
      'alerts.lowMargin[] if ROI < target'
    ],
    routing: {
      receivesFrom: ['orchestrator', 'commerce'],
      sendsTo: ['orchestrator']
    },
    dataContract: {
      expects: 'Per-task telemetry + projected revenue hints',
      provides: 'Cost ledger + ROI status for the session summary'
    },
    successMetric: 'Accurate cost ledger updated after every agent task'
  },
  {
    id: 'design',
    name: 'Design-Agent',
    nickname: 'The Architect',
    role: 'Frontend implementation',
    job: 'Transform aggregated JSON into Shadcn-inspired "Cyber-Medical" components.',
    responsibilities: [
      'Consume Orchestrator’s merged payload and map data to existing Dashboard sections.',
      'Generate layout & state hints (e.g., which tabs to highlight, gradients to apply).',
      'Ensure components remain deterministic and do not cause client-side re-render storms.',
      'Propose new UI modules when upstream data shape changes.'
    ],
    requiredSkills: ['ui-mapper', 'shadcn-theming'],
    inputs: ['Final merged protocol JSON from Orchestrator'],
    outputs: [
      'ui.instructions: { componentId, props, priority }[]',
      'design.assets needed for future iterations'
    ],
    routing: {
      receivesFrom: ['orchestrator', 'scheduler', 'commerce'],
      sendsTo: ['orchestrator']
    },
    dataContract: {
      expects: 'Validated data model covering science, sentiment, schedule, commerce, finance',
      provides: 'Render-ready instructions + fallback copy for empty states'
    },
    successMetric: 'UI instructions cover 100% of surfaced data with no orphaned fields'
  }
];

export const agentGraph = agentSwarm.reduce<Record<AgentId, AgentId[]>>((acc, agent) => {
  acc[agent.id] = agent.routing.sendsTo;
  return acc;
}, {
  orchestrator: [],
  clinical: [],
  social: [],
  scheduler: [],
  commerce: [],
  cfo: [],
  design: []
});
