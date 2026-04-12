'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

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
      appendToAssistant(assistantMsg.id, 'Something went wrong. Please try again.');
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
    <div
      className="flex h-full flex-col overflow-hidden rounded-[16px]"
      style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
    >
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--hair-accent)',
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              ADVISOR · LIVE
            </span>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
              {stackSupplements.length > 0
                ? `Your stack: ${stackSupplements.length} supplement${stackSupplements.length === 1 ? '' : 's'}`
                : 'Supplement science, dosing, stacks.'}
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--fg-dim)' }}
            aria-label="Close advisor"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--hair-accent)',
              }}
            >
              <Sparkles className="h-6 w-6" style={{ color: 'var(--accent)' }} />
            </div>
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              EMPTY STATE
            </span>
            <h3
              className="mt-3 text-[20px] font-extrabold tracking-[-0.4px]"
              style={{ color: 'var(--fg)' }}
            >
              Ask anything about supplements.
            </h3>
            <p className="mt-2 max-w-sm text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
              Mechanism, dosing, what the research says. I&apos;ll skip medical advice — that&apos;s for
              your doctor.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-[22px] ${
                  msg.role === 'user' ? 'font-mono' : ''
                }`}
                style={
                  msg.role === 'user'
                    ? { background: 'var(--accent)', color: '#09090b' }
                    : {
                        background: 'var(--surface-raise)',
                        color: 'var(--fg)',
                        border: '1px solid var(--hair)',
                      }
                }
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span
                      className="h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: 'var(--accent)', animationDelay: '150ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: 'var(--accent)', animationDelay: '300ms' }}
                    />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <footer
        className="px-6 py-4"
        style={{ borderTop: '1px solid var(--hair)', background: 'var(--surface-sink, rgba(0,0,0,0.3))' }}
      >
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
            placeholder="ask about a supplement..."
            className="proto-focus h-11 flex-1 rounded-md px-4 font-mono text-[14px] disabled:opacity-50"
            style={{
              background: 'var(--surface-raise)',
              border: '1px solid var(--hair)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#09090b' }}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p
          className="mt-2 font-mono text-[10px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-faint)' }}
        >
          NOT MEDICAL ADVICE · CONSULT YOUR PROVIDER BEFORE CHANGING SUPPLEMENTS OR MEDICATIONS
        </p>
      </footer>
    </div>
  );
}
