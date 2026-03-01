import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttachment extends Document {
  complaint: Types.ObjectId;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: Buffer; // raw file bytes stored in MongoDB
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Attachment = mongoose.model<IAttachment>(
  "Attachment",
  AttachmentSchema,
);
