import mongoose, { Schema, Document } from "mongoose";

export type KnowledgeSourceType =
  | "faq"
  | "policy"
  | "complaint_template"
  | "admin_upload"
  | "attachment";

export interface IKnowledgeBaseDocument extends Document {
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  category?: string;
  tags: string[];
  embeddingId?: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    department?: string;
    isPublic: boolean;
  };
}

const KnowledgeBaseDocumentSchema = new Schema<IKnowledgeBaseDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sourceType: {
    type: String,
    enum: ["faq", "policy", "complaint_template", "admin_upload", "attachment"],
    required: true,
  },
  category: { type: String },
  tags: { type: [String], default: [] },
  embeddingId: { type: String },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: {
    department: { type: String },
    isPublic: { type: Boolean, default: true },
  },
});

KnowledgeBaseDocumentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const KnowledgeBaseDocument = mongoose.model<IKnowledgeBaseDocument>(
  "KnowledgeBaseDocument",
  KnowledgeBaseDocumentSchema,
);
