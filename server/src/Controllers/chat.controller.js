import { GoogleGenAI } from "@google/genai";
import { Product } from "../Modals/product.modal.js";
import { buildChatSystemPrompt } from "../prompts/index.js";

const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODELS = ["gemini-flash-latest"];
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_CATALOG_PRODUCTS = 80;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const PROVIDER_TIMEOUT_MS = 20_000;

// One client per API key; a second key can point at a different Google project
// when the primary project runs out of quota or credits.
const geminiClients = new Map();

const getGeminiClient = (apiKey) => {
  if (!geminiClients.has(apiKey)) {
    geminiClients.set(
      apiKey,
      new GoogleGenAI({ apiKey, httpOptions: { timeout: PROVIDER_TIMEOUT_MS } }),
    );
  }
  return geminiClients.get(apiKey);
};

// Read at request time: index.js calls dotenv.config() after module imports,
// so top-level constants would miss values loaded from .env.
const getGeminiConfig = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
  ]
    .map((key) => key?.trim())
    .filter(Boolean);

  const models = [
    process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS ??
      DEFAULT_FALLBACK_MODELS.join(",")
    ).split(","),
  ]
    .map((model) => model.trim())
    .filter(Boolean);

  return {
    keys: [...new Set(keys)],
    models: [...new Set(models)],
  };
};

// Optional non-Gemini provider with an OpenAI-compatible chat completions API
// (OpenAI, Groq, OpenRouter, Together, a local gateway, ...). Configure all
// three AI_FALLBACK_* variables to enable it.
const getFallbackConfig = () => {
  const apiKey = process.env.AI_FALLBACK_API_KEY?.trim();
  const model = process.env.AI_FALLBACK_MODEL?.trim();
  if (!apiKey || !model) return null;

  return {
    apiKey,
    model,
    baseUrl: (
      process.env.AI_FALLBACK_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/+$/, ""),
  };
};

// Simple in-memory rate limiting. This is enough for a single dev/small
// deployment; use a shared store (Redis) if the API is scaled horizontally.
const requestLog = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestLog.set(ip, recent);

  // Drop stale entries periodically so the map cannot grow forever.
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (!times.some((time) => now - time < RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }

  return recent.length > RATE_LIMIT_MAX_REQUESTS;
};

const describeProduct = (product) => {
  const category = product.category?.name || "Uncategorised";
  const subcategory = product.subcategory?.name || "";
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const colours = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const stock = variants
    .map((v) => `${v.color || "?"} ${v.size || "?"}: ${v.stock ?? 0}`)
    .join(", ");

  const description = (product.description || "").replace(/\s+/g, " ").trim();

  return [
    `- ${product.title}`,
    `price ₹${product.price}`,
    `category ${category}${subcategory ? ` / ${subcategory}` : ""}`,
    `rating ${product.rating || 0}/5`,
    colours.length ? `colours ${colours.join(", ")}` : null,
    sizes.length ? `sizes ${sizes.join(", ")}` : null,
    stock ? `variant stock ${stock}` : null,
    description ? `description: ${description.slice(0, 280)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

const loadCatalog = async () => {
  const products = await Product.find({})
    .select("title description price rating variants category subcategory")
    .populate("category subcategory", "name")
    .limit(MAX_CATALOG_PRODUCTS)
    .lean();

  if (products.length === 0) return "The catalogue is currently empty.";

  return products.map(describeProduct).join("\n");
};

// Turn client history into a role-alternating conversation that always ends
// with the new user message. Providers differ slightly, so this is converted
// to each provider's shape at call time.
const buildContents = (history, message) => {
  const safeHistory = history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.text === "string" &&
        item.text.trim(),
    )
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text.trim().slice(0, MAX_MESSAGE_LENGTH) }],
    }));

  // A model turn cannot open the conversation; drop the greeting.
  while (safeHistory.length && safeHistory[0].role === "model") {
    safeHistory.shift();
  }

  const trimmed = safeHistory.slice(-MAX_HISTORY_MESSAGES);
  const alternating = [];
  for (const turn of trimmed) {
    const last = alternating.at(-1);
    if (last?.role === turn.role) {
      // Merge consecutive same-role turns so the provider always sees an
      // alternating conversation.
      last.parts[0].text += `\n\n${turn.parts[0].text}`;
    } else {
      alternating.push({
        role: turn.role,
        parts: [{ text: turn.parts[0].text }],
      });
    }
  }

  alternating.push({ role: "user", parts: [{ text: message }] });
  return alternating;
};

const getErrorStatus = (error) => {
  if (Number.isFinite(error?.status)) return error.status;
  if (Number.isFinite(error?.code)) return error.code;
  const match = /"code"\s*:\s*(\d{3})/.exec(error?.message || "");
  return match ? Number(match[1]) : null;
};

const generateWithGemini = async (contents, systemInstruction) => {
  const { keys, models } = getGeminiConfig();
  if (keys.length === 0) return { reply: null, error: null };

  let lastError = null;

  for (const apiKey of keys) {
    const client = getGeminiClient(apiKey);

    for (const model of models) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 512,
          },
        });

        const reply =
          typeof response.text === "string" ? response.text.trim() : "";
        if (!reply) {
          lastError = new Error(`Empty response from ${model}`);
          continue;
        }
        return { reply, provider: `gemini:${model}` };
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);
        console.error(
          `chat: Gemini ${model} failed (status ${status ?? "unknown"}):`,
          error?.message?.slice(0, 200) || error,
        );

        // A malformed request will fail on every model, so stop trying.
        if (status === 400) return { reply: null, error };

        if (status === 402) {
          console.error(
            "chat: this API key's Google project has no Gemini prepayment credits. Add credits to the SAME project that owns GEMINI_API_KEY, or set GEMINI_API_KEY_FALLBACK / AI_FALLBACK_* to another funded provider.",
          );
        } else if (status === 401 || status === 403) {
          console.error(
            "chat: Gemini rejected the API key. Check GEMINI_API_KEY in server/.env.",
          );
        }

        // Key-level problems: move to the next key, not the next model.
        if (status === 401 || status === 402 || status === 403) break;

        // Model-not-found, rate limits, timeouts and 5xx: try the next model.
      }
    }
  }

  return { reply: null, error: lastError };
};

const generateWithFallbackProvider = async (
  { systemInstruction, contents },
  config,
) => {
  const messages = [
    { role: "system", content: systemInstruction },
    ...contents.map((turn) => ({
      role: turn.role === "model" ? "assistant" : "user",
      content: turn.parts[0].text,
    })),
  ];

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.4,
      max_tokens: 512,
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `fallback provider returned ${response.status}: ${
        payload?.error?.message || response.statusText
      }`,
    );
  }

  const rawContent = payload?.choices?.[0]?.message?.content;
  const reply = Array.isArray(rawContent)
    ? rawContent
        .map((part) => part?.text)
        .filter(Boolean)
        .join("\n")
    : rawContent;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("fallback provider returned an empty reply");
  }
  return reply.trim();
};

// Try Gemini (all configured models and keys) first, then the optional
// OpenAI-compatible provider. Returns the first non-empty reply.
const generateReply = async ({ systemInstruction, contents }) => {
  const gemini = await generateWithGemini(contents, systemInstruction);
  if (gemini.reply) return gemini;

  const fallbackConfig = getFallbackConfig();
  if (!fallbackConfig) return { reply: null, error: gemini.error };

  try {
    const reply = await generateWithFallbackProvider(
      { systemInstruction, contents },
      fallbackConfig,
    );
    return { reply, provider: `fallback:${fallbackConfig.model}` };
  } catch (error) {
    console.error(
      "chat: fallback provider failed:",
      error?.message?.slice(0, 200) || error,
    );
    return { reply: null, error };
  }
};

// POST /api/chat
export const chat = async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A message is required",
      });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      });
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      return res.status(429).json({
        success: false,
        message: "You're sending messages too quickly. Please wait a moment and try again.",
      });
    }

    const hasGemini = getGeminiConfig().keys.length > 0;
    const fallbackConfig = getFallbackConfig();
    if (!hasGemini && !fallbackConfig) {
      console.error(
        "chat error: no AI provider configured (set GEMINI_API_KEY or AI_FALLBACK_*)",
      );
      return res.status(503).json({
        success: false,
        message: "The assistant is not configured yet. Please try again later.",
      });
    }

    const catalog = await loadCatalog();
    const systemInstruction = buildChatSystemPrompt(catalog);
    const contents = buildContents(
      Array.isArray(history) ? history : [],
      message.trim(),
    );

    const { reply, provider } = await generateReply({
      systemInstruction,
      contents,
    });

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "The assistant is unavailable right now. Please try again in a moment.",
      });
    }

    console.log(`chat: reply generated via ${provider}`);

    return res.status(200).json({
      success: true,
      message: "Chat reply generated",
      data: { reply },
    });
  } catch (err) {
    // Log the provider error for operators, but never expose internals to the
    // storefront. The most common causes are quota/billing and invalid keys.
    console.error("chat error:", err?.message || err);
    return res.status(502).json({
      success: false,
      message: "The assistant is unavailable right now. Please try again in a moment.",
    });
  }
};
