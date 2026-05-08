import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Stack Lab',
  description: 'A plain-language reference for evidence-graded supplement research.',
};

export default function AboutPage() {
  return (
    <div className="page">
      <div style={{ padding: '64px 0 40px', maxWidth: 720 }}>
        <div
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 11,
            color: 'var(--gold)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
          ⚜ About the Lab
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 'clamp(28px, 4.4vw, 40px)',
            fontWeight: 600,
            letterSpacing: '-0.4px',
            lineHeight: 1.1,
            color: 'var(--text)',
          }}
        >
          A reference work, not a retailer.
        </h1>
        <div className="prose" style={{ marginTop: 24 }}>
          <p>
            Stack Lab indexes peer-reviewed research on commonly-taken
            supplements. Every claim links to the underlying study and carries
            an evidence grade. There are no affiliate links, no product
            rankings, and no sponsored content.
          </p>
          <p>
            We write at three reading levels —{' '}
            <strong>plain</strong>, <strong>balanced</strong>, and{' '}
            <strong>technical</strong> — so a curious beginner and a
            practitioner can use the same page. The underlying data is
            identical; the language changes.
          </p>
          <p>
            Routines are scheduled using pharmacokinetic rules: absorption
            pathways, food-status requirements, interaction severities, and
            known synergies. When two compounds compete for the same
            transporter, the schedule spaces them automatically.
          </p>
          <p>
            None of this is medical advice. Speak with a clinician before
            starting, stopping, or combining supplements — especially if you
            take medication.
          </p>
        </div>
      </div>

      {/* Section rule */}
      <div className="section-rule">
        <div className="label">
          <span className="num">01</span>
          <span>Editorial standards</span>
        </div>
        <span />
        <span className="right" />
      </div>

      <div className="prose">
        <p>
          <strong>Evidence grades.</strong>{' '}
          <strong style={{ color: 'var(--grade-a)' }}>A</strong> requires
          multiple high-quality RCTs or a recent meta-analysis.{' '}
          <strong style={{ color: 'var(--grade-b)' }}>B</strong> requires RCTs
          with mixed findings or a single high-quality trial.{' '}
          <strong style={{ color: 'var(--grade-c)' }}>C</strong> is for
          preclinical or observational evidence only.
        </p>
        <p>
          <strong>Safety grades</strong> follow the same scale but reflect
          adverse event rates at typical doses in healthy adults.
        </p>
        <p>
          <strong>Interactions</strong> are flagged at three severities. High
          means space the dose or speak with your doctor. Moderate means be
          aware. Low is for completeness.
        </p>
      </div>

      {/* Section rule 02 */}
      <div className="section-rule">
        <div className="label">
          <span className="num">02</span>
          <span>Scheduling engine</span>
        </div>
        <span />
        <span className="right" />
      </div>

      <div className="prose">
        <p>
          The routine builder uses a deterministic scheduling engine. Each
          supplement has rules for preferred timing (morning / midday / evening
          / bedtime), food requirements, fat solubility, stimulant and sedating
          properties.
        </p>
        <p>
          When two supplements share a conflict — competing for the same
          mineral transporter, for instance — the engine moves one to a
          different dosing window and explains why. No guessing, no heuristics
          that silently fail.
        </p>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
