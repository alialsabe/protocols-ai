import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "@/components/shared/Nav";
import { MeshBackground } from "@/components/shared/MeshBackground";

const outfit = Outfit({
  variable: "--font-outfit",
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
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <MeshBackground />
        <DesktopNav />
        <main className="flex-1 relative min-h-dvh overflow-y-auto pb-16 md:pb-0" style={{ zIndex: 2 }}>
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
