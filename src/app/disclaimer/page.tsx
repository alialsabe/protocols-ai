import Link from 'next/link';

export const metadata = {
  title: 'Medical Disclaimer — Stack Lab',
  description:
    'Stack Lab is for education only. It does not provide medical advice, diagnosis, or treatment.',
};

export default function DisclaimerPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 80px' }}>
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
        ⚜ Medical disclaimer
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
        Medical disclaimer
      </h1>
      <p
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-jetbrains-mono), var(--mono)',
          fontSize: 11,
          color: 'var(--text-3)',
          letterSpacing: '0.4px',
        }}
      >
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <Section title="No medical advice">
        <p>
          Stack Lab is an educational reference for supplement research. The information presented on this site, including supplement profiles, dosing notes, scheduling output, audit findings, and bloodwork analysis, is provided for general informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p>
          Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition, lab results, prescription medication, or supplement regimen. Never disregard professional medical advice or delay in seeking it because of something you have read on this site.
        </p>
      </Section>

      <Section title="Bloodwork analysis">
        <p>
          Our bloodwork feature uses optical character recognition and rule-based matching to flag patterns in lab marker values you upload. It cannot replace clinical interpretation of your results. Reference ranges vary between labs and individuals; thresholds we use are conservative defaults, not personalised diagnostic cutoffs.
        </p>
        <p>
          We do not store the raw PDFs you upload. We do persist the structured marker values extracted from them so you can review your history. You can request deletion at any time.
        </p>
      </Section>

      <Section title="Drug and supplement interactions">
        <p>
          Our audit feature surfaces known interactions and timing conflicts based on a curated database. It is not exhaustive. New interactions are discovered regularly, individual responses vary, and confounding factors (dose, formulation, genetics, other medications, food, alcohol) can change risk. Treat audit findings as starting points for a conversation with your prescribing clinician, not a final verdict.
        </p>
      </Section>

      <Section title="No doctor-patient relationship">
        <p>
          Use of this site does not create a doctor-patient relationship between you and Stack Lab or any contributors to the content on this site. We are not your healthcare provider.
        </p>
      </Section>

      <Section title="Affiliate links and editorial independence">
        <p>
          Some links on this site are affiliate links, meaning we may earn a commission at no additional cost to you when you purchase through them. Affiliate relationships never determine which compounds appear in our reference, how they are graded, or which products we surface. See our{' '}
          <Link href="/terms">terms of service</Link>{' '}
          for the full affiliate disclosure.
        </p>
      </Section>

      <Section title="In an emergency">
        <p>
          If you think you may have a medical emergency, call your doctor or emergency services immediately. Do not rely on this website or any electronic communication for emergency medical care.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          Stack Lab, its operators, and its contributors are not liable for any damages arising from reliance on the information provided on this site. Your use of the site is at your own risk.
        </p>
      </Section>

      <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-3)' }}>
        Questions? See our{' '}
        <Link href="/terms" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)' }}>
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)' }}>
          privacy policy
        </Link>
        .
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2
        style={{
          margin: '0 0 14px',
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 10,
          color: 'var(--gold)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--gold)' }} />
        {title}
      </h2>
      <div className="prose">{children}</div>
    </section>
  );
}
