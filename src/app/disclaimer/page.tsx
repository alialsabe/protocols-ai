import Link from 'next/link';

export const metadata = {
  title: 'Medical Disclaimer — Materia',
  description:
    'Materia is for education only. It does not provide medical advice, diagnosis, or treatment.',
};

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-[720px] px-5 py-16 md:px-10 md:py-20">
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--accent)' }}
      >
        Legal
      </span>
      <h1
        className="mt-2 text-[36px] font-extrabold tracking-[-0.5px] md:text-[44px]"
        style={{ color: 'var(--fg)' }}
      >
        Medical disclaimer
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--fg-dim)' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <Section title="No medical advice">
        <p>
          Materia is an educational reference for supplement research. The information presented on this site, including supplement profiles, dosing notes, scheduling output, audit findings, and bloodwork analysis, is provided for general informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p className="mt-3">
          Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition, lab results, prescription medication, or supplement regimen. Never disregard professional medical advice or delay in seeking it because of something you have read on this site.
        </p>
      </Section>

      <Section title="Bloodwork analysis">
        <p>
          Our bloodwork feature uses optical character recognition and rule-based matching to flag patterns in lab marker values you upload. It cannot replace clinical interpretation of your results. Reference ranges vary between labs and individuals; thresholds we use are conservative defaults, not personalised diagnostic cutoffs.
        </p>
        <p className="mt-3">
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
          Use of this site does not create a doctor-patient relationship between you and Materia or any contributors to the content on this site. We are not your healthcare provider.
        </p>
      </Section>

      <Section title="Affiliate links and editorial independence">
        <p>
          Some links on this site are affiliate links, meaning we may earn a commission at no additional cost to you when you purchase through them. Affiliate relationships never determine which compounds appear in our reference, how they are graded, or which products we surface. See our{' '}
          <Link href="/terms" className="underline" style={{ color: 'var(--accent-ink)' }}>
            terms of service
          </Link>{' '}
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
          Materia, its operators, and its contributors are not liable for any damages arising from reliance on the information provided on this site. Your use of the site is at your own risk.
        </p>
      </Section>

      <p className="mt-12 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        Questions? See our{' '}
        <Link href="/terms" className="underline" style={{ color: 'var(--accent-ink)' }}>
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline" style={{ color: 'var(--accent-ink)' }}>
          privacy policy
        </Link>
        .
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2
        className="text-[20px] font-bold tracking-[-0.3px]"
        style={{ color: 'var(--fg)' }}
      >
        {title}
      </h2>
      <div
        className="mt-3 text-[14px] leading-[24px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        {children}
      </div>
    </section>
  );
}
