// ─────────────────────────────────────────────────────────────
// pipeline/analyze.ts
// Stage 1: ANALYZE — uses OpenAI GPT to classify the message
// and decide what memory action to take.
//
// One LLM call returns everything:
//   - memory type (profile/preference/knowledge/experience)
//   - action (STORE/UPDATE/MERGE/IGNORE/FORGET)
//   - importance score (0-1)
//   - conflict detection (which existing memory contradicts this)
//   - reasoning (human-readable explanation)
//   - tags
// ─────────────────────────────────────────────────────────────
import OpenAI from "openai";
import { env } from "../config/env";
import { PipelineContext, LLMAnalysisResult, ExistingMemory } from "../types";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function buildPrompt(
  inputText: string,
  existingMemories: ExistingMemory[]
): string {
  const memoriesSection =
    existingMemories.length === 0
      ? "No existing memories yet."
      : existingMemories
          .map(
            (m, i) =>
              `[${i + 1}] ID: ${m.id} | Type: ${m.type} | Importance: ${m.importance}\nContent: "${m.content}"`
          )
          .join("\n\n");

  return `You are MemoryOS, a memory decision engine for AI agents.

Analyze the new information and decide what to do with it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW INFORMATION:
"${inputText}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXISTING MEMORIES (${existingMemories.length} total):
${memoriesSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEMORY TYPES:
- "profile"    → who the user IS (name, location, job, background)
- "preference" → what they LIKE or DISLIKE (tools, habits, styles)
- "knowledge"  → facts or information they shared
- "experience" → things that HAPPENED to them (completed tasks, events)

ACTIONS:
- "STORE"  → new memory, no conflict, worth keeping
- "UPDATE" → conflicts with an existing memory, replace it
- "MERGE"  → very similar to existing memory, combine them
- "IGNORE" → trivial, conversational filler, not worth storing
- "FORGET" → user explicitly wants something removed

IMPORTANCE (0.0 to 1.0):
- 0.9-1.0 → user explicitly asked to remember, or critical personal fact
- 0.7-0.9 → significant preference, location, life fact
- 0.5-0.7 → useful context, moderately relevant
- 0.3-0.5 → minor detail
- 0.0-0.3 → conversational filler → use IGNORE

RULES:
1. Be conservative. Not everything deserves storage.
2. Greetings, "ok", "thanks", questions → IGNORE
3. If conflicting with existing memory → set conflictWithId to the EXACT ID
4. If unsure between STORE and IGNORE → IGNORE

DISTILLATION RULES (for distilledContent field):
- Always write in third person: "User loves biryani" not "I love biryani"
- Remove filler words: "guess what i changed my mind i love biryani" → "User loves biryani"
- Be concise and factual: max 10 words
- For UPDATE: distill the NEW fact only
- For IGNORE: set distilledContent to empty string ""

Respond ONLY with a valid JSON object, no other text:

{
  "memoryType": "profile" | "preference" | "knowledge" | "experience",
  "action": "STORE" | "UPDATE" | "MERGE" | "IGNORE" | "FORGET",
  "importance": 0.0,
  "confidence": 0.0,
  "distilledContent": "Concise third-person fact. e.g. 'User loves biryani' not 'guess what i love biryani'",
  "conflictWithId": "exact-memory-id-here" | null,
  "reasoning": "One sentence explaining the decision.",
  "tags": ["tag1", "tag2"]
}`;
}

export async function runAnalysis(
  context: PipelineContext
): Promise<LLMAnalysisResult> {
  const start = Date.now();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",   // fast + cheap, perfect for a decision engine
    max_tokens: 512,
    temperature: 0.1,        // low temperature = consistent decisions
    response_format: { type: "json_object" }, // forces valid JSON output
    messages: [
      {
        role: "user",
        content: buildPrompt(context.inputText, context.existingMemories ?? []),
      },
    ],
  });

  const rawText = response.choices[0]?.message?.content ?? "{}";

  let result: LLMAnalysisResult;
  try {
    result = JSON.parse(rawText) as LLMAnalysisResult;
  } catch {
    console.error("[Pipeline] Failed to parse LLM response:", rawText);
    result = {
      memoryType: "knowledge",
      action: "IGNORE",
      importance: 0,
      confidence: 0,
      distilledContent: "",
      conflictWithId: null,
      reasoning: "Failed to parse analysis. Defaulting to IGNORE.",
      tags: [],
    };
  }

  context.timing["analyze"] = Date.now() - start;
  return result;
}