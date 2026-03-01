import { Router } from "express";
import multer from "multer";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import {
  KnowledgeBaseDocument,
  IKnowledgeBaseDocument,
} from "../models/KnowledgeBaseDocument";
import { extractTextFromBuffer } from "../services/attachmentIngestion.service";
import { ingestTextAsChunks } from "../services/kbIngestion.service";
import { getEmbedding } from "../services/chatbot.service";

const router = Router();

const kbUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

// Create KB document
router.post(
  "/documents",
  authenticate,
  authorize(["staff", "admin"]),
  async (req: AuthRequest, res) => {
    const { title, content, sourceType, category, tags, metadata } = req.body;
    if (!title || !content || !sourceType) {
      return res
        .status(400)
        .json({ message: "title, content, sourceType required" });
    }

    try {
      const docs = await ingestTextAsChunks({
        baseTitle: title,
        content,
        sourceType,
        category,
        tags: tags || [],
        isPublic: metadata?.isPublic ?? true,
      });

      res.status(201).json({ created: docs.length });
    } catch (err) {
      console.error("Failed to ingest KB document", err);
      return res.status(503).json({
        message:
          "Knowledge base embedding service is temporarily unavailable. Please try again later.",
      });
    }
  },
);

// Upload file and ingest into KB (admin/staff)
router.post(
  "/documents/upload",
  authenticate,
  authorize(["staff", "admin"]),
  kbUpload.single("file"),
  async (req: AuthRequest, res) => {
    const file = req.file;
    const { title, sourceType, category, tags, isPublic } = req.body;

    if (!file) {
      return res.status(400).json({ message: "file is required" });
    }

    const text = await extractTextFromBuffer(file.buffer, file.mimetype);
    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "Could not extract text from uploaded file" });
    }

    const content = text.trim();
    const kbTitle = title || file.originalname;

    try {
      const docs = await ingestTextAsChunks({
        baseTitle: kbTitle,
        content,
        sourceType: (sourceType as any) || "admin_upload",
        category: category || undefined,
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : [tags]
          : ["upload", "admin"],
        isPublic: isPublic !== "false",
      });

      res.status(201).json({ created: docs.length });
    } catch (err) {
      console.error("Failed to ingest uploaded KB file", err);
      return res.status(503).json({
        message:
          "Knowledge base embedding service is temporarily unavailable. Please try again later.",
      });
    }
  },
);

// List KB documents
router.get(
  "/documents",
  authenticate,
  authorize(["staff", "admin"]),
  async (req, res) => {
    const { sourceType, category } = req.query;
    const filter: any = {};
    if (sourceType) filter.sourceType = sourceType;
    if (category) filter.category = category;
    const docs = await KnowledgeBaseDocument.find(filter).sort({
      createdAt: -1,
    });
    res.json(docs);
  },
);

// Delete KB document
router.delete(
  "/documents/:id",
  authenticate,
  authorize(["staff", "admin"]),
  async (req, res) => {
    await KnowledgeBaseDocument.findByIdAndDelete(req.params.id);
    res.status(204).send();
  },
);

// Reindex: recompute embeddings
router.post(
  "/reindex",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    try {
      const docs = await KnowledgeBaseDocument.find();
      for (const doc of docs) {
        const embedding = await getEmbedding(`${doc.title}\n\n${doc.content}`);
        doc.embedding = embedding;
        await doc.save();
      }
      res.json({ updated: docs.length });
    } catch (err) {
      console.error("Failed to reindex knowledge base", err);
      return res.status(503).json({
        message:
          "Knowledge base embedding service is temporarily unavailable. Please try again later.",
      });
    }
  },
);

// Stats
router.get(
  "/stats",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const total = await KnowledgeBaseDocument.countDocuments();
    const bySource = await KnowledgeBaseDocument.aggregate([
      { $group: { _id: "$sourceType", count: { $sum: 1 } } },
    ]);
    res.json({ total, bySource });
  },
);

export default router;
