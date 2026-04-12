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

  return { allowed: true };
}
