import { GoogleGenAI, type Content, type FunctionDeclaration, type Schema } from "@google/genai";
import { env, hasGemini } from "./env";

let client: GoogleGenAI | undefined;

/** Lazily-created Gemini client. Throws if no key is configured. */
export function gemini(): GoogleGenAI {
  if (!hasGemini()) throw new Error("GEMINI_API_KEY is not configured");
  if (!client) client = new GoogleGenAI({ apiKey: env().GEMINI_API_KEY });
  return client;
}

export const DEFAULT_TIMEOUT_MS = 20_000;

/** Ask Gemini for strict JSON that matches a schema. Returns raw text. */
export async function generateJson(opts: {
  system: string;
  prompt: string;
  schema: Schema;
  temperature?: number;
}): Promise<string> {
  const res = await gemini().models.generateContent({
    model: env().GEMINI_MODEL,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      responseSchema: opts.schema,
      temperature: opts.temperature ?? 0.4,
      abortSignal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    },
  });
  return res.text ?? "";
}

export interface ToolTurnResult {
  text: string;
  calls: Array<{ name: string; args: Record<string, unknown> }>;
  /** The full model turn, to append to history before sending tool results. */
  modelContent?: Content;
}

/** One turn of a tool-using chat. The caller runs the tools and loops. */
export async function generateWithTools(opts: {
  system: string;
  history: Content[];
  tools: FunctionDeclaration[];
  temperature?: number;
}): Promise<ToolTurnResult> {
  const res = await gemini().models.generateContent({
    model: env().GEMINI_MODEL,
    contents: opts.history,
    config: {
      systemInstruction: opts.system,
      tools: [{ functionDeclarations: opts.tools }],
      temperature: opts.temperature ?? 0.5,
      abortSignal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    },
  });
  const calls = (res.functionCalls ?? []).map((c) => ({
    name: c.name ?? "",
    args: (c.args ?? {}) as Record<string, unknown>,
  }));
  return { text: res.text ?? "", calls, modelContent: res.candidates?.[0]?.content };
}

/** Test hook. */
export function resetGeminiClient() {
  client = undefined;
}
