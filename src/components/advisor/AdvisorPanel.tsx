'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

/**
 * AI Advisor chat panel. Streams responses from /api/advisor.
 * Designed to slide in as an overlay or embed inline.
 *
 * Never blocks on Claude latency — the first token appears within
 * ~500ms thanks to streaming.
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AdvisorPanel({
  stackSupplements = [],
  onClose,
}: {
  stackSupplements?: string[];
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);
    track(ANALYTICS_EVENTS.ADVISOR_QUERY, { has_stack: stackSupplements.length > 0 });

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          stackSupplements,
        }),
      });

      if (!response.ok || !response.body) {
        appendToAssistant(assistantMsg.id, "I couldn't reach the advisor. Please try again.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        appendToAssistant(assistantMsg.id, chunk);
      }
    } catch {
      appendToAssistant(assistantMsg.id, "Something went wrong. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  function appendToAssistant(id: string, chunk: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#06d6a0]/10 border border-[#06d6a0]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#06d6a0]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Supplement Advisor</h3>
            <p className="text-[11px] text-[#71717a]">
              {stackSupplements.length > 0
                ? `Your stack: ${stackSupplements.length} supplement${stackSupplements.length === 1 ? '' : 's'}`
                : 'Ask about supplement science, dosing, and stacks'}
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center text-[#71717a] hover:text-white hover:bg-white/[0.04] rounded-lg"
            aria-label="Close advisor"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#06d6a0]/10 border border-[#06d6a0]/20 mb-4">
              <Sparkles className="w-6 h-6 text-[#06d6a0]" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Ask me anything about supplements</h4>
            <p className="text-xs text-[#71717a] max-w-xs mx-auto">
              Mechanism, dosing, what the research says. I&apos;ll skip medical advice — that&apos;s for your doctor.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#06d6a0] text-black'
                    : 'bg-[#18181b] text-white border border-white/[0.04]'
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#06d6a0] animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-[#06d6a0] animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-[#06d6a0] animate-pulse" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="px-5 py-4 border-t border-white/[0.06] bg-[#09090b]/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={streaming}
            placeholder="Ask about a supplement..."
            className="flex-1 h-11 px-4 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#06d6a0]/40 focus:ring-1 focus:ring-[#06d6a0]/20 text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="h-11 w-11 inline-flex items-center justify-center bg-[#06d6a0] hover:bg-[#06d6a0]/90 disabled:opacity-40 text-black rounded-lg transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#52525b] leading-relaxed">
          Not medical advice. Consult a healthcare provider before making changes to your supplements or medications.
        </p>
      </footer>
    </div>
  );
}
