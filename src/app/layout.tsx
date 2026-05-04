import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Cinzel, IBM_Plex_Mono } from 'next/font/google';
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

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Stack Lab, Scan your supplement stack, see what to drop',
  description:
    'Point your phone at a supplement bottle. We parse the label, build your stack, and tell you what to drop, swap, or keep. Average user saves $87 a month.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${cinzel.variable} ${ibmPlexMono.variable} h-full`}
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
