import Link from 'next/link';
import { AdvisorPanel } from '@/components/advisor/AdvisorPanel';

export default function AdvisorPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[#06d6a0] font-semibold tracking-tight">
          ← Protocols.ai
        </Link>
        <h1 className="text-sm font-medium text-white tracking-wide uppercase">AI Advisor</h1>
        <div className="w-24" />
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-[75vh]">
          <AdvisorPanel />
        </div>
      </main>
    </div>
  );
}
