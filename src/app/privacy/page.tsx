import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Stack Lab',
  description: 'How Stack Lab collects, uses, stores, and protects your data.',
};

export default function PrivacyPage() {
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
        Privacy policy
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--fg-dim)' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <Section title="Summary">
        <p>
          We collect the minimum data needed to give you a working supplement reference and personalised analysis. We do not sell your data. We do not store the raw bloodwork PDFs you upload. You can delete your account and all associated data at any time.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>Account information.</strong> When you sign up, your email address is stored by our authentication provider (Supabase). We do not see or store your password — Supabase handles credentials with industry-standard hashing.
          </li>
          <li>
            <strong>Stack and routine data.</strong> The supplements you add, the medications you list, your scheduling preferences, and your saved stacks. This is associated with your account.
          </li>
          <li>
            <strong>Biometrics.</strong> Optional weight and height you enter for per-kilogram dose calculations.
          </li>
          <li>
            <strong>Bloodwork markers.</strong> Structured lab values (e.g. ferritin = 28 ng/mL) extracted from PDFs you upload. The raw PDF is processed in memory and discarded; only the extracted markers persist.
          </li>
          <li>
            <strong>Usage analytics.</strong> Page views, click events, and aggregated funnel data via PostHog. We tag analytics events with a stable identifier when you are signed in so we can compute funnels per user.
          </li>
          <li>
            <strong>Server logs.</strong> Standard web server logs (IP address, user agent, timestamps, request paths) for security and abuse prevention. Retained for 30 days.
          </li>
        </ul>
      </Section>

      <Section title="What we do not collect">
        <ul className="ml-5 list-disc space-y-2">
          <li>Raw PDF files of your bloodwork. They are deleted from temporary storage after extraction.</li>
          <li>Payment information. We do not currently process payments. If we add paid tiers, payment will be handled by a regulated processor (e.g. Stripe), not us.</li>
          <li>Social Security Numbers, government ID numbers, or other regulated identifiers.</li>
          <li>Location data beyond the country-level inference from your IP address.</li>
        </ul>
      </Section>

      <Section title="Third parties we use">
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Supabase</strong> — authentication and database hosting.</li>
          <li><strong>Vercel</strong> — application hosting and CDN.</li>
          <li><strong>OpenRouter</strong> — large language model proxy used for bloodwork PDF text extraction. Your PDF is sent to OpenRouter for OCR and is not retained by them per their data retention policy.</li>
          <li><strong>PostHog</strong> — product analytics. Configured to collect identified events only when you are signed in; pageviews are anonymous otherwise.</li>
        </ul>
        <p className="mt-3">
          Each third party has its own privacy policy. We do not share your data with parties beyond what is required to operate the service.
        </p>
      </Section>

      <Section title="Cookies and similar technologies">
        <p>
          We use cookies and localStorage for authentication state, your saved routine, your medical disclaimer acknowledgement, and analytics. You can clear these through your browser settings; doing so will sign you out and reset your local routine.
        </p>
      </Section>

      <Section title="Your rights">
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Access.</strong> Request a copy of your data.</li>
          <li><strong>Correction.</strong> Edit or correct your data through the app.</li>
          <li><strong>Deletion.</strong> Delete your account and all associated data. Email us to request this until in-app self-serve deletion is available.</li>
          <li><strong>Portability.</strong> Export your stack and bloodwork history as JSON on request.</li>
          <li><strong>Opt out of analytics.</strong> Use Do Not Track or a privacy extension; we honour DNT for PostHog identification.</li>
        </ul>
        <p className="mt-3">
          California residents (CCPA) and EU/UK residents (GDPR) have additional rights around their personal data. Contact us to exercise them.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          Account data and your stack history are retained until you delete your account. Bloodwork markers are retained until you delete the upload or your account. Server logs are retained for 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Stack Lab is not directed at children under 18. We do not knowingly collect data from children. If you believe a child has provided us with personal information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy as the product evolves. Material changes will be notified in-app or by email. The &quot;last updated&quot; date at the top of this page reflects the most recent revision.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions or to exercise your rights, contact us through the email address listed on{' '}
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
