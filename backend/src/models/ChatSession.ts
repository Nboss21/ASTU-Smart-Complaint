import mongoose, { Schema, Document, Types } from "mongoose";

export type ChatRole = "user" | "assistant";
export type ChatFeedback = "positive" | "negative" | null;

export interface IChatMessageSource {
  document: Types.ObjectId;
  relevanceScore: number;
  excerpt: string;
}

export interface IChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
  sources: IChatMessageSource[];
  feedback: ChatFeedback;
}

export interface IChatSession extends Document {
  user: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSourceSchema = new Schema<IChatMessageSource>({
  document: { type: Schema.Types.ObjectId, ref: "KnowledgeBaseDocument" },
  relevanceScore: { type: Number, required: true },
  excerpt: { type: String, required: true },
});

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sources: { type: [ChatMessageSourceSchema], default: [] },
  feedback: {
    type: String,
    enum: ["positive", "negative", null],
    default: null,
  },
});

const ChatSessionSchema = new Schema<IChatSession>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  messages: { type: [ChatMessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ChatSessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const ChatSession = mongoose.model<IChatSession>(
  "ChatSession",
  ChatSessionSchema,
);
