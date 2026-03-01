import fs from "fs/promises";
import path from "path";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function analyzeImageWithGemini(
  imagePath: string,
  userPrompt?: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const fileBuffer = await fs.readFile(imagePath);
  const base64Data = fileBuffer.toString("base64");
  const mimeType = guessMimeType(imagePath);

  const prompt =
    userPrompt && userPrompt.trim().length > 0
      ? userPrompt
      : "You are an assistant for ASTU students. Clearly explain what you see in this image and how it might relate to student complaints or campus issues, using simple language.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    },
    {
      params: { key: GEMINI_API_KEY },
    },
  );

  const candidates = response.data?.candidates || [];
  const text =
    candidates[0]?.content?.parts
      ?.map((p: any) => (p.text as string) || "")
      .join("") || "I could not interpret this image.";

  return text;
}

function guessMimeType(imagePath: string): string {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}
