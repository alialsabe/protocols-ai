import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Materia',
  description: 'The agreement between you and Materia for using this site.',
};

export default function TermsPage() {
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
        Terms of service
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--fg-dim)' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <Section title="Acceptance of terms">
        <p>
          By accessing or using Materia (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 18 years old to use Materia. By using the Service you represent and warrant that you are 18 or older and have the legal capacity to enter into this agreement.
        </p>
      </Section>

      <Section title="Educational purpose only">
        <p>
          Materia provides general information about supplements, drug-supplement interactions, and lab markers for educational purposes. The Service does not provide medical advice, diagnosis, or treatment. See our{' '}
          <Link href="/disclaimer" className="underline" style={{ color: 'var(--accent-ink)' }}>
            medical disclaimer
          </Link>{' '}
          for full detail. You agree to consult a qualified healthcare provider before acting on any information from the Service.
        </p>
      </Section>

      <Section title="Account responsibilities">
        <p>
          You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Notify us promptly of any unauthorised use. We use Supabase for authentication and never see your password directly.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          You agree not to:
        </p>
        <ul className="ml-5 mt-3 list-disc space-y-2">
          <li>Use the Service to provide medical advice to others.</li>
          <li>Scrape, copy, or republish substantial portions of our content without written permission.</li>
          <li>Submit false bloodwork, misuse the audit feature to evade prescribing controls, or attempt to extract our underlying data sources.</li>
          <li>Reverse engineer, decompile, or attempt to access non-public APIs.</li>
          <li>Submit automated traffic that violates our published rate limits, or otherwise interfere with the Service.</li>
        </ul>
      </Section>

      <Section title="Affiliate disclosure">
        <p>
          Some links on Materia are affiliate links. When you click an affiliate link and make a purchase, we may earn a commission at no additional cost to you. Affiliate relationships do not influence which compounds appear in our reference, how compounds are graded, which dosage recommendations are surfaced, or the content of any audit or bloodwork analysis. We disclose this in keeping with Federal Trade Commission guidelines on endorsements and testimonials.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          Materia, its content, designs, and original code are owned by us or our licensors. You may use the Service for personal, non-commercial purposes. The supplement reference content is compiled from publicly available scientific sources; underlying citations belong to their original publishers.
        </p>
      </Section>

      <Section title="User content">
        <p>
          You retain ownership of the data you upload (your stack, medications, biometrics, bloodwork markers). By submitting content you grant us a limited licence to process, display, and store that content for the purpose of operating the Service for you.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You may delete your account at any time by contacting us. We may suspend or terminate your access for violation of these Terms or for activity that creates risk for the Service or other users.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, MATERIA AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, OR HEALTH OUTCOMES, ARISING FROM YOUR USE OF THE SERVICE.
        </p>
      </Section>

      <Section title="Indemnification">
        <p>
          You agree to indemnify and hold harmless Materia and its operators from any claim or demand made by a third party arising out of your use of the Service or your violation of these Terms.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These Terms are governed by the laws of the jurisdiction where Materia is operated, without regard to conflict of law principles. Disputes will be resolved in the courts of that jurisdiction.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these Terms from time to time. Material changes will be notified in-app or by email. Your continued use of the Service after changes take effect constitutes acceptance.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For questions about these Terms, contact us through the email address listed on{' '}
          <Link href="/about" className="underline" style={{ color: 'var(--accent-ink)' }}>
            our about page
          </Link>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-bold tracking-[-0.3px]" style={{ color: 'var(--fg)' }}>
        {title}
      </h2>
      <div className="mt-3 text-[14px] leading-[24px]" style={{ color: 'var(--fg-muted)' }}>
        {children}
      </div>
    </section>
  );
}
