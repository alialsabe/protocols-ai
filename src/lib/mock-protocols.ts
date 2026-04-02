import type { Biometrics, ProtocolReport } from './protocol-types';

const baseReports: Record<string, Omit<ProtocolReport, 'query'>> = {
  ashwagandha: {
    subject: 'Ashwagandha (KSM-66)',
    science: {
      summary:
        'Double-blind studies show a 25-30% reduction in serum cortisol after 8 weeks at 600 mg/day, alongside improvements in sleep latency.',
      sourceCount: 14,
      findings: [
        {
          title: 'Cortisol modulation',
          detail: 'Placebo-controlled trials measured a mean 27.9% drop in morning cortisol.',
          citation: 'PMID: 23439798',
        },
        {
          title: 'Anxiety score improvements',
          detail: 'Hamilton Anxiety Rating Scale decreased by 6.3 points over 60 days.',
          citation: 'PMID: 19718255',
        },
      ],
      interactions: [
        {
          label: 'Immunosuppressants',
          severity: 'high',
          note: 'Ashwagandha may counteract immunosuppressive therapies; monitor closely.',
        },
        {
          label: 'Sedatives / Benzodiazepines',
          severity: 'moderate',
          note: 'Additive sedative effects reported—avoid co-dosing at bedtime.',
        },
      ],
      sideEffects: [
        {
          label: 'GI upset',
          incidence: '14%',
          mitigation: 'Pair with food rich in fat/protein to buffer mucosal irritation.',
        },
        {
          label: 'Vivid dreams',
          incidence: '12%',
        },
      ],
    },
    social: {
      transcriptSummary:
        'Huberman and Attia recommend cycling (5 on / 2 off) to avoid emotional blunting; community anecdotes highlight deeper REM sleep but lethargy if overdosed.',
      anecdotes: [
        {
          quote: 'Felt a calm focus within 30 minutes, but motivation dipped if I stayed on for weeks.',
          source: 'Huberman Lab Clip',
          reliability: 'high',
        },
        {
          quote: 'Best sleep ever, but I dream in IMAX now.',
          source: 'Amazon Reviewer',
          reliability: 'medium',
        },
      ],
    },
    sentiment: {
      positive: 0.78,
      neutral: 0.12,
      negative: 0.1,
      topPositive: 'Deep sleep + calmer mornings',
      topNegative: 'Lethargy / emotional flattening',
    },
    commerce: {
      retailer: 'Amazon',
      product: 'Nutricost KSM-66 600 mg (90 caps)',
      price: '$14.99',
      affiliateLink: 'https://www.amazon.com/dp/B0TEST1234?tag=ali-20',
      inStock: true,
      savingsNote: '11% below 90-day trailing average',
    },
    schedule: [
      {
        time: '08:00 AM',
        title: 'Morning Cortisol Support',
        context: 'Take with high-fat breakfast to improve absorption.',
        supplements: ['Ashwagandha 300 mg', 'Fish Oil'],
      },
      {
        time: '02:00 PM',
        title: 'Buffer Window',
        context: 'Avoid stacked sedatives / stimulants for 4 hrs.',
        supplements: [],
        caution: 'Keep Zinc separate to prevent receptor competition.',
        severity: 'warning',
      },
      {
        time: '09:00 PM',
        title: 'Sleep Primer',
        context: 'Optional second 300 mg dose with Magnesium Glycinate.',
        supplements: ['Ashwagandha 300 mg', 'Magnesium Glycinate'],
      },
    ],
    dosage: {
      loading: 'Not recommended (↑ GI distress).',
      maintenance: '0.0075 g/kg — e.g., 600 mg/day for 80 kg.',
      formula: 'weightKg * 7.5 mg',
    },
    finance: {
      tokensUsed: 1825,
      usdCost: 0.52,
      roiNote: 'Affiliate upside estimated $2.10 per purchase → positive margin.',
    },
  },
  creatine: {
    subject: 'Creatine Monohydrate',
    science: {
      summary:
        'Longitudinal RCTs confirm strength and cognitive benefits at 3-5 g/day with excellent safety over 5 years.',
      sourceCount: 32,
      findings: [
        {
          title: 'Strength + Lean Mass',
          detail: 'Bench press 1RM improved 8% over placebo in trained athletes.',
          citation: 'PMID: 18091016',
        },
        {
          title: 'Neuroprotection',
          detail: 'Improved working memory scores in sleep-deprived adults.',
          citation: 'PMID: 15531663',
        },
      ],
      interactions: [
        {
          label: 'Caffeine (mega doses)',
          severity: 'moderate',
          note: 'Excess caffeine may blunt creatine water retention—separate timing.',
        },
      ],
      sideEffects: [
        {
          label: 'Water Retention',
          incidence: '18%',
          mitigation: 'Normalize within 4-7 days; monitor weight swings.',
        },
      ],
    },
    social: {
      transcriptSummary:
        'Endurance athletes highlight faster repeat sprint recovery; biohackers report mood stability when paired with electrolytes.',
      anecdotes: [
        {
          quote: 'Brain fog vanished after 2 weeks at 5 g/day.',
          source: 'r/Nootropics',
          reliability: 'medium',
        },
        {
          quote: 'Loading phase wrecked my stomach—skip it.',
          source: 'YouTube Review',
          reliability: 'medium',
        },
      ],
    },
    sentiment: {
      positive: 0.82,
      neutral: 0.1,
      negative: 0.08,
      topPositive: 'Power output + better mood',
      topNegative: 'Bloating during loading',
    },
    commerce: {
      retailer: 'Thorne',
      product: 'Thorne Creatine 450 g',
      price: '$38.00',
      affiliateLink: 'https://www.thorne.com/product/12345?tag=ali-20',
      inStock: true,
      savingsNote: 'Bundle discount eligible (subscribe & save 10%).',
    },
    schedule: [
      {
        time: '07:30 AM',
        title: 'Maintenance Dose',
        context: 'Stir into 12 oz water with electrolytes post-breakfast.',
        supplements: ['Creatine 5 g', 'Electrolytes'],
      },
      {
        time: '05:30 PM',
        title: 'Training Window',
        context: 'Optional second 2.5 g if evening resistance session.',
        supplements: ['Creatine 2.5 g'],
      },
    ],
    dosage: {
      loading: 'Optional: 0.3 g/kg for 5 days (expect GI risk).',
      maintenance: '0.03 g/kg (≈5 g for 80 kg).',
      formula: 'weightKg * 0.03 g',
    },
    finance: {
      tokensUsed: 1490,
      usdCost: 0.41,
      roiNote: 'High LTV via subscribe-and-save → 6x payback.',
    },
  },
};

export function getMockProtocol(query: string, biometrics?: Biometrics): ProtocolReport {
  const key = query.trim().toLowerCase();
  const base = baseReports[key] ?? baseReports.ashwagandha;
  const weight = biometrics?.weightKg ?? 80;
  const subjectBase = (base.subject ?? query.trim()) || 'Protocol';
  const subject = subjectBase.includes('(')
    ? subjectBase
    : `${subjectBase} Protocol`;

  const isCreatine = base === baseReports.creatine;
  const maintenanceSuggested = isCreatine
    ? `${(weight * 0.03).toFixed(1)} g / day`
    : `${Math.round(weight * 7.5)} mg / day`;

  return {
    ...base,
    query,
    subject,
    dosage: {
      ...base.dosage,
      maintenance: maintenanceSuggested,
    },
  };
}



