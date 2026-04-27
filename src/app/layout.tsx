import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SupplementCatalogProvider } from '@/components/v2/advisor/SupplementCatalogProvider';
import { FloatingAdvisor } from '@/components/v2/advisor/FloatingAdvisor';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { PillBackground } from '@/components/PillBackground';

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

export const metadata: Metadata = {
  title: 'Materia — Supplement Reference',
  description:
    'Plain-language research on the supplements people actually take — graded, sourced, and scheduled.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <PillBackground />
        {/* z-index: 1 so all content sits above the z-index: 0 background */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AnalyticsProvider>
            <SupplementCatalogProvider>
              <Nav />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
              <FloatingAdvisor />
            </SupplementCatalogProvider>
          </AnalyticsProvider>
        </div>
      </body>
    </html>
  );
}
