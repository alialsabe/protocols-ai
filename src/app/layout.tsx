import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SupplementCatalogProvider } from '@/components/v2/advisor/SupplementCatalogProvider';
import { FloatingAdvisor } from '@/components/v2/advisor/FloatingAdvisor';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { MedicalDisclaimerGate } from '@/components/MedicalDisclaimerGate';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Stack Lab — Your daily briefing for supplements',
  description:
    'A daily briefing on your supplement stack: what works, what is duplicative, what to drop. Plain-language reads, not a tracker.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
