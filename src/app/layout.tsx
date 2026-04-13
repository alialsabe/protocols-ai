import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { SupplementCatalogProvider } from "@/components/v2/advisor/SupplementCatalogProvider";
import { FloatingAdvisor } from "@/components/v2/advisor/FloatingAdvisor";

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
  title: "Protocols.ai",
  description: "Live supplement intelligence and scheduling",
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
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>
          <SupplementCatalogProvider>
            {children}
            <FloatingAdvisor />
          </SupplementCatalogProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
