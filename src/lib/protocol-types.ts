export interface Biometrics {
  weightKg?: number;
  age?: number;
  sex?: 'male' | 'female' | 'unspecified';
}

export interface ScienceFinding {
  title?: string;
  claim?: string;
  detail?: string;
  context?: string;
  citation?: string;
  source?: string;
  quality?: 'high' | 'medium' | 'low';
  publishedDate?: string;
  link?: string;
}

export interface InteractionFlag {
  label: string;
  severity: 'low' | 'moderate' | 'high' | 'synergy';
  note: string;
}

export interface SideEffectMetric {
  label: string;
  incidence: string;
  mitigation?: string;
}

export interface CommerceRecommendation {
  retailer: string;
  product: string;
  price: string;
  affiliateLink: string;
  inStock: boolean;
  savingsNote?: string;
}

export interface SentimentCluster {
  positive: number;
  neutral: number;
  negative: number;
  topPositive: string;
  topNegative: string;
}

export interface Anecdote {
  quote?: string;
  context?: string;
  source?: string;
  influencer?: string;
  reliability?: 'high' | 'medium' | 'low';
  stance?: 'pro' | 'con' | 'neutral';
}

export interface ScheduleBlock {
  time: string;
  title: string;
  context: string;
  supplements: string[];
  caution?: string;
  severity?: 'info' | 'warning';
}

export interface DosagePlan {
  loading?: string;
  maintenance: string;
  formula?: string;
}

export interface FinanceSnapshot {
  tokensUsed: number;
  usdCost: number;
  roiNote: string;
}

export interface ClinicalEvidence {
  score: number;
  findings: ScienceFinding[];
}

export interface InfluencerSentiment {
  score: number;
  mentions: Anecdote[];
}

// ── Medicine Interaction Types ───────────────────────────────────────
export interface MedicineInteraction {
  medicineName: string;
  medicineClass?: string; // SSRI, blood_thinner, statin, thyroid_med, etc.
  severity: 'low' | 'moderate' | 'high' | 'contraindicated';
  mechanism: string;
  recommendation: string;
  source?: string;
}

// ── Scheduler Types ─────────────────────────────────────────────────
export interface UserRoutine {
  wakeTime: string;  // HH:MM format
  sleepTime: string; // HH:MM format
  meals: {
    breakfast: string; // HH:MM
    lunch: string;     // HH:MM
    dinner: string;    // HH:MM
  };
  intermittentFasting?: boolean;
  fastingWindowStart?: string; // HH:MM
  fastingWindowEnd?: string;   // HH:MM
}

export interface SchedulerInput {
  supplements: string[]; // slugs
  routine?: UserRoutine;
  medications?: string[]; // optional list of current medications
}

export interface SchedulerWarning {
  type: 'conflict' | 'spacing' | 'food' | 'medication';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  supplements: string[];
}

export interface SchedulerOutput {
  blocks: ScheduleBlock[];
  warnings: SchedulerWarning[];
  generatedAt: string;
}

// ── Supplement Conflict ─────────────────────────────────────────────
export interface SupplementConflict {
  supplementA: string;
  supplementB: string;
  conflictType: 'antagonistic' | 'synergistic' | 'spacing_required';
  minSpacingHours?: number;
  mechanism: string;
  severity: 'low' | 'moderate' | 'high';
}

export interface CompanionSuggestion {
  supplement: string;
  why: string;
  strength: 'common' | 'strong';
}

export interface TopBrand {
  name: string;
  why: string;
  source: 'Labdoor';
  link?: string;
}

export interface ClinicalStudy {
  id: string;
  supplementId: string;
  title: string;
  category: string;
  subcategory?: string | null;
  url?: string | null;
  pmid?: string | null;
  year?: number | null;
  studyType?: string | null;
  sampleSize?: number | null;
  outcome?: string | null;
  quality?: string | null;
}

export interface StudyCategoryCount {
  category: string;
  count: number;
}

export interface ProductionInfo {
  source: string;
  method: string;
  qualityMarkers: string;
  dataSource?: 'manual' | 'llm_generated' | 'category_default';
}

export interface SupplementExtras {
  plainSummary: string;
  keyBenefits: string[];
  bestFor: string[];
  whoShouldAvoid: string[];
  whatToExpect: string;
  mechanism: string;
  commonMyths: { myth: string; reality: string }[];
  sources: string[];
}

export interface ProtocolReport {
  id?: string;
  query?: string;
  name?: string;
  subject?: string;
  baseCompound?: string;
  specificForm?: string;
  supplementTypes?: string[];
  summary?: string;
  target?: string;
  extras?: SupplementExtras;
  science?: {
    summary: string;
    sourceCount: number;
    findings: ScienceFinding[];
    interactions: InteractionFlag[];
    sideEffects: SideEffectMetric[];
  };
  clinicalEvidence?: ClinicalEvidence;
  clinicalStudies?: ClinicalStudy[];
  clinicalStudyCategoryCounts?: StudyCategoryCount[];
  social?: {
    transcriptSummary: string;
    anecdotes: Anecdote[];
  };
  influencerSentiment?: InfluencerSentiment;
  sentiment?: SentimentCluster;
  commerce?: CommerceRecommendation;
  schedule?: ScheduleBlock[];
  dosage?: DosagePlan;
  finance?: FinanceSnapshot;
  medicineInteractions?: MedicineInteraction[];
  conflicts?: SupplementConflict[];
  companionSuggestions?: CompanionSuggestion[];
  topBrands?: TopBrand[];
  tags?: { tag: string; tagType: string }[];
  popularityScore?: number;
  contraindications?: string[];
  recommendedDosage?: string;
  costPerDayEstimate?: number;
  production?: ProductionInfo;
}
