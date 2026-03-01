import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStatusHistory extends Document {
  complaint: Types.ObjectId;
  oldStatus: string;
  newStatus: string;
  changedBy: Types.ObjectId;
  remarks?: string;
  timestamp: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true },
  oldStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const StatusHistory = mongoose.model<IStatusHistory>(
  "StatusHistory",
  StatusHistorySchema,
);
