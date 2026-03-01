import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticate, AuthRequest } from "../middleware/auth";
import { askGeminiWithContext } from "../services/chatbot.service";
import { hybridRetrieve } from "../services/hybridSearch.service";
import { ChatSession } from "../models/ChatSession";
import { SearchAnalytics } from "../models/SearchAnalytics";
import { analyzeImageWithGemini } from "../services/imageAnalysis.service";

const router = Router();

const imageUploadDir = path.join(process.cwd(), "uploads", "chatbot-images");
const imageUpload = multer({ dest: imageUploadDir });

router.post("/query", authenticate, async (req: AuthRequest, res) => {
  const startedAt = Date.now();
  const { query, hybrid_ratio, temperature, sessionId } = req.body;
  const q = (query || "").toString().trim();
  if (!q) return res.status(400).json({ message: "query is required" });

  const hybridRatio = typeof hybrid_ratio === "number" ? hybrid_ratio : 0.7;
  const temp = typeof temperature === "number" ? temperature : 0.3;

  try {
    const { sources, usedHybridRatio } = await hybridRetrieve(q, {
      hybridRatio,
      k: 8,
    });

    let answer: string;
    if (!sources.length) {
      answer =
        "I couldn't find relevant information in the knowledge base for this question. " +
        "Please contact your department or support staff for further assistance.";
    } else {
      const context = sources
        .map(
          (s, idx) =>
            `[S${idx + 1}] Title: ${s.title}\nType: ${s.sourceType}\nCategory: ${
              s.category || "N/A"
            }\nContent: ${s.contentSnippet}\n`,
        )
        .join("\n");

      answer = await askGeminiWithContext(q, context, temp);
    }

    const responseTimeMs = Date.now() - startedAt;

    let session: any;

    if (sessionId) {
      session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.user.toString() !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      session.messages.push(
        {
          role: "user",
          content: q,
          timestamp: new Date(startedAt),
          sources: [],
          feedback: null,
        },
        {
          role: "assistant",
          content: answer,
          timestamp: new Date(),
          sources: sources.map((s) => ({
            document: s.documentId,
            relevanceScore: s.relevance,
            excerpt: s.contentSnippet,
          })),
          feedback: null,
        },
      );
      await session.save();
    } else {
      session = await ChatSession.create({
        user: req.user!.id,
        messages: [
          {
            role: "user",
            content: q,
            timestamp: new Date(startedAt),
            sources: [],
            feedback: null,
          },
          {
            role: "assistant",
            content: answer,
            timestamp: new Date(),
            sources: sources.map((s) => ({
              document: s.documentId,
              relevanceScore: s.relevance,
              excerpt: s.contentSnippet,
            })),
            feedback: null,
          },
        ],
      });
    }

    await SearchAnalytics.create({
      query: q,
      hybridRatioUsed: usedHybridRatio,
      resultCount: sources.length,
      responseTimeMs,
      userRated: false,
      satisfaction: null,
    });

    res.json({
      answer,
      sources,
      sessionId: session._id,
    });
  } catch (err: any) {
    // Surface a clearer error to the client while logging details on the server
    // eslint-disable-next-line no-console
    console.error("[chatbot] query error", err?.message || err);
    return res
      .status(502)
      .json({
        message: "Failed to query AI assistant. Please try again later.",
      });
  }
});

router.get("/sessions", authenticate, async (req: AuthRequest, res) => {
  const sessions = await ChatSession.find({ user: req.user!.id })
    .sort({ updatedAt: -1 })
    .limit(50);

  const items = sessions.map((s) => {
    const firstUser = s.messages.find((m) => m.role === "user");
    const lastAssistant = [...s.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    return {
      id: s._id,
      title:
        (firstUser?.content || "New conversation").slice(0, 60) ||
        "New conversation",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastAnswerPreview: lastAssistant?.content.slice(0, 80) || "",
    };
  });

  res.json({ sessions: items });
});

router.get("/sessions/:id", authenticate, async (req: AuthRequest, res) => {
  const session = await ChatSession.findById(req.params.id).populate(
    "messages.sources.document",
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.user.toString() !== req.user!.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const messages = session.messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));

  res.json({
    sessionId: session._id,
    messages,
  });
});

router.get("/faq", async (_req, res) => {
  // Placeholder static FAQs
  res.json([
    {
      q: "How to submit a complaint?",
      a: 'Go to the complaints section and click "New Complaint".',
    },
    {
      q: "How to track status?",
      a: "Open your complaint list and check the status column.",
    },
  ]);
});

router.post("/feedback", authenticate, async (req: AuthRequest, res) => {
  const { sessionId, messageIndex, feedback } = req.body;
  if (!sessionId || (feedback !== "positive" && feedback !== "negative")) {
    return res.status(400).json({
      message: "sessionId and feedback ('positive'|'negative') required",
    });
  }

  const session = await ChatSession.findById(sessionId);
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.user.toString() !== req.user!.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const idx =
    typeof messageIndex === "number"
      ? messageIndex
      : session.messages.length - 1;
  if (idx < 0 || idx >= session.messages.length) {
    return res.status(400).json({ message: "Invalid messageIndex" });
  }

  session.messages[idx].feedback = feedback;
  await session.save();

  await SearchAnalytics.updateMany(
    { query: { $exists: true } },
    { $set: { userRated: true, satisfaction: feedback === "positive" } },
  );

  res.json({ ok: true });
});

router.get("/suggestions", authenticate, async (_req: AuthRequest, res) => {
  // Simple static + generic suggestions; can be extended using analytics
  res.json({
    suggestions: [
      "How do I submit a new complaint?",
      "How can I track the status of my ticket?",
      "What are the university rules about exam scheduling?",
      "How do I contact administration for urgent issues?",
    ],
  });
});

export default router;

// Analyze an uploaded image with the assistant
router.post(
  "/image-query",
  authenticate,
  imageUpload.single("image"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "image file is required" });
      }

      const { prompt } = req.body;
      const answer = await analyzeImageWithGemini(req.file.path, prompt);

      return res.json({ answer });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[chatbot] image-query error", err?.message || err);
      return res
        .status(502)
        .json({ message: "Failed to analyze image. Please try again later." });
    }
  },
);

