import axios from "axios";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const VOYAGE_EMBED_URL = "https://api.voyageai.com/v1/embeddings";

export const getEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");

  const maxRetries = 3;
  let delayMs = 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await axios.post(
        VOYAGE_EMBED_URL,
        {
          model: "voyage-2",
          input: text,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      return resp.data.data[0].embedding;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message =
        data?.error?.message || err.message || "Unknown Voyage embedding error";

      if (status === 429 && attempt < maxRetries) {
        console.warn(
          `Voyage embedding rate-limited (attempt ${attempt + 1}/${maxRetries}). Retrying after ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }

      throw new Error(
        `Voyage embedding error${status ? ` (${status})` : ""}: ${message}`,
      );
    }
  }

  throw new Error("Voyage embedding failed after retries");
};

export const askGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  try {
    const resp = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message =
      data?.error?.message || err.message || "Unknown Gemini API error";
    throw new Error(
      `Gemini API error${status ? ` (${status})` : ""}: ${message}`,
    );
  }
};

export const askGeminiWithContext = async (
  userQuery: string,
  context: string,
  temperature = 0.3,
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const systemPrompt =
    "You are an educational support assistant for a university complaint and information system. " +
    "Your answers must sound like a helpful human: warm, clear, and easy to follow. " +
    "Always start with a very short 12 sentence summary in plain language, then give 36 short numbered steps or paragraphs explaining what the user should know or do. " +
    "Use only simple text (no markdown symbols like *, #, or [S1]) so the message reads naturally in a chat bubble. " +
    "Base your answer ONLY on the provided context from the university knowledge base. If the context is not sufficient, clearly say you don't know and suggest contacting the appropriate human support (such as the department office or help desk), instead of guessing.\n\n";

  const fullPrompt =
    systemPrompt +
    "Context sources:\n" +
    context +
    "\n\nUser question: " +
    userQuery +
    "\n\nAnswer:";

  try {
    const resp = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    });

    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message =
      data?.error?.message || err.message || "Unknown Gemini API error";
    throw new Error(
      `Gemini API error${status ? ` (${status})` : ""}: ${message}`,
    );
  }
};
