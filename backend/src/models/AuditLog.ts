import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  action: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  details: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
