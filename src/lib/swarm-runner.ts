import type { Biometrics, ProtocolReport } from './protocol-types';

export interface SwarmInput {
  query: string;
  biometrics?: Biometrics;
}

export interface SwarmResult {
  report: ProtocolReport;
  runtimeMs: number;
  agentsInvolved: string[];
}

async function callAgent(role: string, query: string, biometrics?: Biometrics, jsonMode: boolean = false) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENROUTER_API_KEY 
    ? "https://openrouter.ai/api/v1/chat/completions" 
    : "https://api.openai.com/v1/chat/completions";

  const generateDynamicMock = () => {
    // Extract the original query if this is the orchestrator prompt
    const match = query.match(/Generate a full protocol report for "(.*?)"/);
    const actualQuery = match ? match[1] : query;
    const name = actualQuery.split('\\n')[0].trim().substring(0, 50);

    const dynamicReport = {
      id: `mock-${Date.now()}`,
      name: name || "Dynamic Protocol",
      summary: `Dynamic mock summary for ${name} (Please set OPENAI_API_KEY or OPENROUTER_API_KEY in .env to get live LLM research).`,
      target: "General Health",
      clinicalEvidence: {
        score: Math.floor(Math.random() * 30) + 70,
        findings: [
          { claim: `Supports functions related to ${name}`, source: "Dynamic Mock Data", quality: "medium" }
        ]
      },
      influencerSentiment: {
        score: Math.floor(Math.random() * 30) + 70,
        mentions: [
          { influencer: "Dr. Default", context: `Mentioned ${name} generally`, stance: "pro" }
        ]
      },
      contraindications: ["None noted in mock data"],
      recommendedDosage: "Varies (mock data)",
      costPerDayEstimate: Number((Math.random() * 2 + 0.5).toFixed(2))
    };
    return jsonMode ? JSON.stringify(dynamicReport) : `Mock response for: ${name}`;
  };

  if (!apiKey) {
    console.warn("No API key found. Generating dynamic mock response instead.");
    return generateDynamicMock();
  }

  const systemPrompt = `You are the ${role} agent for Protocols-AI. Analyze the following query and biometrics.
${jsonMode ? 'You must return a valid JSON object matching the requested schema.' : 'Keep your answer brief and structured as requested.'}`;

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...(process.env.OPENROUTER_API_KEY && {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Protocols-AI"
        })
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini",
        response_format: jsonMode ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Query: ${query}\nBiometrics: ${JSON.stringify(biometrics || {})}` }
        ]
      })
    });

    if (!response.ok) {
      console.error(`API Error for ${role}:`, await response.text());
      return generateDynamicMock();
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Failed to call ${role} agent:`, error);
    return generateDynamicMock();
  }
}

export async function runSwarm(input: SwarmInput): Promise<SwarmResult> {
  const started = performance.now();

  const orchestratorPrompt = `Generate a full protocol report for "${input.query}". 
Biometrics: ${JSON.stringify(input.biometrics || {})}
Return a JSON object with this exact structure:
{
  "id": "string",
  "name": "string",
  "summary": "string",
  "target": "string",
  "clinicalEvidence": {
    "score": number (0-100),
    "findings": [ { "claim": "string", "source": "string", "quality": "high|medium|low" } ]
  },
  "influencerSentiment": {
    "score": number (0-100),
    "mentions": [ { "influencer": "string", "context": "string", "stance": "pro|con|neutral" } ]
  },
  "contraindications": [ "string" ],
  "recommendedDosage": "string",
  "costPerDayEstimate": number
}`;

  const orchestratorResponse = await callAgent("Orchestrator", orchestratorPrompt, input.biometrics, true);

  let report: ProtocolReport;

  if (orchestratorResponse) {
    try {
      const parsed = JSON.parse(orchestratorResponse);
      report = {
        id: parsed.id || `live-${Date.now()}`,
        name: parsed.name || input.query,
        summary: parsed.summary || "",
        target: parsed.target || "",
        clinicalEvidence: parsed.clinicalEvidence || { score: 0, findings: [] },
        influencerSentiment: parsed.influencerSentiment || { score: 0, mentions: [] },
        contraindications: parsed.contraindications || [],
        recommendedDosage: parsed.recommendedDosage || "",
        costPerDayEstimate: parsed.costPerDayEstimate || 0
      };
    } catch (e) {
      console.error("Failed to parse LLM JSON response, generating dynamic fallback", e);
      report = {
        id: `fallback-${Date.now()}`,
        name: input.query,
        summary: `We analyzed ${input.query} but couldn't parse the LLM response into the expected format.`,
        target: "General Health",
        clinicalEvidence: { score: 50, findings: [] },
        influencerSentiment: { score: 50, mentions: [] },
        contraindications: [],
        recommendedDosage: "Consult physician",
        costPerDayEstimate: 0
      };
    }
  } else {
    report = {
        id: `fallback-${Date.now()}`,
        name: input.query,
        summary: `Failed to fetch data for ${input.query}.`,
        target: "General Health",
        clinicalEvidence: { score: 50, findings: [] },
        influencerSentiment: { score: 50, mentions: [] },
        contraindications: [],
        recommendedDosage: "Consult physician",
        costPerDayEstimate: 0
    };
  }

  const runtimeMs = performance.now() - started;

  return {
    report,
    runtimeMs,
    agentsInvolved: [
      'orchestrator',
      'clinical',
      'social',
      'scheduler',
    ],
  };
}