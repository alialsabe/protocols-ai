import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "@/components/shared/Nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Protocols.ai — Supplement Intelligence",
  description: "Research any supplement with clinical data, interaction checks, and dosage guidance. Build your personalized protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Background layers */}
        <div className="vc-radial-glow" />
        <div className="vc-grid-bg" />

        <DesktopNav />
        <main className="flex-1 relative min-h-dvh pb-20 md:pb-0" style={{ zIndex: 10 }}>
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
