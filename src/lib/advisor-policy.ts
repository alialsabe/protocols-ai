/**
 * Content policy for the AI Advisor.
 *
 * We block questions that require clinical judgment about medication
 * interactions. One viral bad-advice incident ends a health product.
 * The safe answer to these is always: "Consult your doctor / pharmacist."
 *
 * This check runs BEFORE the Claude call. If the question triggers a
 * policy rule, we short-circuit with a canned response.
 */

const CLINICAL_PATTERNS = [
  // Explicit "can I take X with Y" medication questions
  /\b(can i take|is it safe to take|should i take)\b.*\b(with|while on|while taking)\b/i,
  // Asking about medication interactions directly
  /\b(interact|interaction|contraindicat)\b.*\b(medication|drug|prescription|medicine)\b/i,
  // Asking about stopping medication
  /\b(stop|discontinue|quit|replace|instead of)\b.*\b(medication|medicine|prescription|drug|blood thinner|antidepressant|blood pressure|statin|metformin|insulin|ssri|maoi|warfarin)\b/i,
  // Asking for diagnosis or treatment
  /\b(diagnos|treat|cure)\b.*\b(depression|anxiety|cancer|diabetes|heart|disease|disorder|syndrome)\b/i,
  // Pregnancy / breastfeeding questions require clinical judgment
  /\b(pregnan|breastfeed|nursing|trimester)\b/i,
  // Pediatric dosing
  /\b(child|kid|toddler|infant|baby|under\s*1[0-8])\b.*\b(dose|take|give)\b/i,
];

const CLINICAL_REFUSAL =
  "This is a question that really deserves a clinician's judgment — your doctor or pharmacist has access to your full medical history and can give you specific guidance I can't. I'd rather be honest that I'm not the right tool for this than give you an answer that sounds confident but could be wrong for your situation.\n\nFor general supplement science questions (how a supplement works, typical dosing, what the research says), I'm here to help.";

const OFF_TOPIC_PATTERNS = [
  // Code/programming requests
  /\b(write|generate|create|debug|fix|review)\b.*\b(code|function|script|program|class|api|sql|javascript|python|typescript|css|html)\b/i,
  // Recipe/cooking questions (not nutrition)
  /\b(recipe|how to (cook|bake|make)|ingredients for)\b/i,
  // Politics / news / current events
  /\b(politic|election|president|democrat|republican|war|invasion)\b/i,
  // Generic life advice / relationships
  /\b(my (girlfriend|boyfriend|wife|husband|partner|boss))\b/i,
  // Math / homework
  /\b(solve|calculate|integral|derivative)\b.*\b(equation|problem|x\s*=|y\s*=)\b/i,
  // Jailbreak attempts
  /\b(ignore|disregard|forget).*(previous|prior|above|system|instructions)\b/i,
  /\b(pretend|roleplay|act as|you are now)\b/i,
];

const OFF_TOPIC_REFUSAL =
  "I only help with supplement questions — things like how a compound works, typical dosing, evidence quality, or how something fits into a stack. Want to ask me about a specific supplement instead?";

export interface PolicyResult {
  allowed: boolean;
  refusalMessage?: string;
}

export function checkAdvisorPolicy(userMessage: string): PolicyResult {
  const normalized = userMessage.trim();
  if (!normalized) return { allowed: false, refusalMessage: 'Please enter a question.' };

  for (const pattern of CLINICAL_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, refusalMessage: CLINICAL_REFUSAL };
    }
  }

  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, refusalMessage: OFF_TOPIC_REFUSAL };
    }
  }

  return { allowed: true };
}
