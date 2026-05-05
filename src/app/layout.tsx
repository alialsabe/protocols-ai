import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Cinzel } from 'next/font/google';
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

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Stack Lab — Build your stack like a character',
  description:
    'A daily inventory and audit for your supplement stack: rarity, evidence grade, redundancies, and what to drop. Built for biohackers who think in stats.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${cinzel.variable} h-full`}
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
