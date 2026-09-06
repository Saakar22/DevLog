import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set in environment.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// Safe log and error sanitization helper
function sanitizeErrorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  const raw = typeof err === "object" && err !== null && "message" in err
    ? String((err as any).message)
    : String(err);

  return raw
    .replace(/AIza[0-9A-Za-z_\-]{35}/g, "[REDACTED_API_KEY]")
    .replace(/key=[A-Za-z0-9_\-]+/gi, "key=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]");
}

// Resilient Model Fallback Ladder per Production Directives
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

// Fallback runner utility
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini Model Fallback] Model '${model}' failed:`, sanitizeErrorMessage(err));
      lastError = err;
      // Recoverable error check: 404, 429, 500, 503, etc. Proceed to next ladder step.
      continue;
    }
  }

  throw lastError || new Error("All models in the resilient fallback ladder failed.");
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now()
  });
});

// 1. Conversational Chat Endpoint (Free-form multi-turn rubber-ducking / debugging help)
app.post("/api/chat", async (req, res) => {
  try {
    // Null-Safe Destructuring
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : "";

    if (messages.length === 0) {
      return res.status(400).json({ error: "Missing or empty 'messages' array in request payload." });
    }

    // Format history for Gemini SDK
    // The messages array contains { role: 'user' | 'model', content: string }
    const contents = messages.map((m: any) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

    const systemInstruction = systemPrompt || 
      "You are DevLog AI, a world-class pragmatic senior software engineer and rubber-ducking debugging partner. " +
      "Your purpose is to help the developer diagnose bugs, dissect stack traces, evaluate design tradeoffs, examine race conditions, " +
      "and formulate crisp solutions. Be concise, technically precise, ask targeted diagnostic questions when needed, " +
      "and provide clear code snippets when helpful. Focus strictly on debugging and architecture.";

    const { response, modelUsed } = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const replyText = response.text || "";
    return res.json({
      text: replyText,
      modelUsed,
    });
  } catch (error: any) {
    console.error("[DevLog Chat Error]:", sanitizeErrorMessage(error));
    return res.status(500).json({
      error: "Failed to generate conversational debugging response from AI service.",
    });
  }
});

// 2. Structured Extraction Endpoint (DevLog Extension - Schema-enforced JSON extraction)
// Schema definition matching Directive 8:
// {
//   "title": "string, short human-readable summary of the problem",
//   "rootCause": "string, one or two sentences",
//   "resolution": "string, what fixed it or current status if unresolved",
//   "tags": ["string", "lowercase, e.g. race-condition, segfault, off-by-one, auth"],
//   "difficulty": "integer 1-5",
//   "resolved": "boolean",
//   "language": "string, e.g. python, cpp, java (optional)",
//   "timeSpentMinutes": "integer, optional, only if user mentioned a duration"
// }
const devLogExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Short human-readable summary of the problem or bug investigated.",
    },
    rootCause: {
      type: Type.STRING,
      description: "One or two sentences explaining the underlying root cause or challenge.",
    },
    resolution: {
      type: Type.STRING,
      description: "What fixed it or current investigation status if still unresolved.",
    },
    tags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Array of lowercase tags describing failure patterns, e.g. race-condition, null-pointer, auth, memory-leak, off-by-one, async-timing.",
    },
    difficulty: {
      type: Type.INTEGER,
      description: "Subjective technical difficulty from 1 (trivial) to 5 (extremely elusive or intricate).",
    },
    resolved: {
      type: Type.BOOLEAN,
      description: "True if the bug or problem was resolved during the session, false otherwise.",
    },
    language: {
      type: Type.STRING,
      description: "Programming language or runtime if identifiable (e.g. typescript, python, rust, go, c++, java, sql). Optional or null if unspecified.",
    },
    timeSpentMinutes: {
      type: Type.INTEGER,
      description: "Estimated time spent in minutes if mentioned by the user. Optional or null if unspecified.",
    },
  },
  required: ["title", "rootCause", "resolution", "tags", "difficulty", "resolved"],
};

app.post("/api/extract-log", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const transcript = Array.isArray(body.transcript) ? body.transcript : [];

    if (transcript.length === 0) {
      return res.status(400).json({ error: "Missing or empty 'transcript' array." });
    }

    // Prepare transcript as text block for extraction
    const formattedTranscript = transcript
      .map((msg: any) => `${msg.role === "user" ? "DEVELOPER" : "AI MENTOR"}: ${msg.content}`)
      .join("\n\n");

    const promptText = 
      "Analyze the following debugging session transcript between a software developer and an AI mentor. " +
      "Extract a structured DevLog record following the schema strictly.\n" +
      "- Ensure all tags are normalized to lowercase strings (e.g. 'race-condition', 'firestore', 'hydration', 'cors').\n" +
      "- Difficulty must be an integer between 1 and 5.\n" +
      "- Title should be descriptive yet concise (e.g. 'Stale Token Header in Cloud Run Ingress').\n" +
      "- Root cause should pinpoint the technical mechanism.\n\n" +
      `--- TRANSCRIPT ---\n${formattedTranscript}\n--- END TRANSCRIPT ---`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: devLogExtractionSchema,
        temperature: 0.1, // High precision for structured schema extraction
      },
    });

    const rawJson = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error("[DevLog Extraction] Model output failed JSON parsing.");
      return res.status(502).json({
        error: "Model output failed structured JSON schema parsing.",
      });
    }

    // Defensive validation & normalization
    const validatedLog = {
      title: String(parsed.title || "Untitled Debugging Session").trim(),
      rootCause: String(parsed.rootCause || "Root cause under investigation.").trim(),
      resolution: String(parsed.resolution || "Status pending.").trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean)
        : ["general-bug"],
      difficulty: Math.max(1, Math.min(5, Number(parsed.difficulty) || 3)),
      resolved: Boolean(parsed.resolved),
      language: parsed.language ? String(parsed.language).toLowerCase().trim() : undefined,
      timeSpentMinutes: parsed.timeSpentMinutes ? Number(parsed.timeSpentMinutes) : undefined,
    };

    return res.json({
      log: validatedLog,
      modelUsed,
    });
  } catch (error: any) {
    console.error("[DevLog Extraction Error]:", sanitizeErrorMessage(error));
    return res.status(500).json({
      error: "Failed to extract structured debugging record from session.",
    });
  }
});

async function startServer() {
  // Vite middleware for development vs production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DevLog Server active on port ${PORT} [PID: ${process.pid}]`);
  });
}

startServer();
