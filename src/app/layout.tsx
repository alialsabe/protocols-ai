import type { Metadata } from 'next';
import { Geist_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SupplementCatalogProvider } from '@/components/v2/advisor/SupplementCatalogProvider';
import { FloatingAdvisor } from '@/components/v2/advisor/FloatingAdvisor';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { MedicalDisclaimerGate } from '@/components/MedicalDisclaimerGate';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stack Lab — Supplement & Peptide Stack Manager',
  description:
    'Plan, schedule, and audit your supplement and peptide stack with evidence-backed research. Included with Revive One.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div className="site-shell">
          <AnalyticsProvider>
            <SupplementCatalogProvider>
              <Nav />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
              <FloatingAdvisor />
              <MedicalDisclaimerGate />
            </SupplementCatalogProvider>
          </AnalyticsProvider>
        </div>
      </body>
    </html>
  );
}
