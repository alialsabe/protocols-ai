import { cookies } from 'next/headers';
import { createClient } from '../../../../utils/supabase/server';
import { checkAdvisorPolicy } from '@/lib/advisor-policy';

/**
 * AI Advisor endpoint. Streams a Claude response.
 *
 * POST /api/advisor
 * Body: {
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>
 *   stackSupplements?: string[]
 * }
 *
 * Flow:
 *   1. Content policy check on the latest user message → short-circuit refusal
 *   2. Load the current user's profile (if signed in) for personalization
 *   3. Stream the Claude response back via a ReadableStream (SSE-ish plaintext)
 *
 * Never throws — always returns a valid response, even on failure.
 */

interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are the ProtocolsAI supplement advisor. You help users understand supplements: how they work, what the science says, typical dosing, and how they might fit into a stack.

Rules:
- You are NOT a doctor. Be explicit about this when relevant.
- Never recommend stopping, starting, or changing prescribed medication.
- Never answer questions about medication interactions that require clinical judgment. Instead say: "That's a question for your doctor or pharmacist."
- Never diagnose conditions.
- Cite specific supplement science when possible (mechanism, typical doses, notable studies).
- If a user's question is vague, ask one clarifying question before answering.
- Keep responses focused. Short paragraphs. No marketing language.
- If the user has a saved supplement stack, reference it when relevant.

Format responses as plain text. No markdown headers. Short, direct, honest.`;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const messages: AdvisorMessage[] = Array.isArray(payload?.messages) ? payload.messages : [];
  const stackSupplements: string[] = Array.isArray(payload?.stackSupplements)
    ? payload.stackSupplements
    : [];

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) {
    return plainTextResponse('Please ask a question to get started.');
  }

  // Content policy
  const policy = checkAdvisorPolicy(lastUserMessage.content);
  if (!policy.allowed) {
    return plainTextResponse(policy.refusalMessage ?? 'I cannot answer that question.');
  }

  // Load user profile (best-effort — anonymous users are welcome)
  let userContext = '';
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      userContext = `The user is signed in.`;
      if (stackSupplements.length > 0) {
        userContext += ` Their saved stack includes: ${stackSupplements.join(', ')}.`;
      }
    } else {
      userContext = 'The user is browsing anonymously (no saved stack).';
    }
  } catch {
    userContext = 'The user is browsing anonymously (no saved stack).';
  }

  // Check API key — gracefully degrade if not configured
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return plainTextResponse(
      "The AI advisor isn't fully configured yet. In the meantime, try searching for a specific supplement to see its science and dosage data.",
    );
  }

  // Stream the Claude response
  try {
    return await streamClaudeResponse({
      apiKey,
      userContext,
      conversationHistory: messages.slice(-6), // last 6 turns for context budget
    });
  } catch {
    return plainTextResponse(
      "I'm having trouble reaching the advisor right now. Please try again in a moment.",
    );
  }
}

function plainTextResponse(text: string): Response {
  return new Response(text, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

async function streamClaudeResponse(args: {
  apiKey: string;
  userContext: string;
  conversationHistory: AdvisorMessage[];
}): Promise<Response> {
  const systemMessage = `${SYSTEM_PROMPT}\n\nContext: ${args.userContext}`;

  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      system: systemMessage,
      messages: args.conversationHistory,
    }),
  });

  if (!claudeResponse.ok || !claudeResponse.body) {
    return plainTextResponse(
      "I'm having trouble reaching the advisor right now. Please try again in a moment.",
    );
  }

  // Transform Claude's SSE stream into plain text delta chunks
  const transformed = new ReadableStream({
    async start(controller) {
      const reader = claudeResponse.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(parsed.delta.text ?? ''));
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      } catch {
        // Stream interrupted — send nothing, just close
      } finally {
        controller.close();
      }
    },
  });

  return new Response(transformed, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-content-type-options': 'nosniff',
    },
  });
}
