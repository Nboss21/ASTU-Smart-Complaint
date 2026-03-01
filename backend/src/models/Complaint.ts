import mongoose, { Schema, Document, Types } from "mongoose";

export type ComplaintStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "archived";

export interface IComplaint extends Document {
  title: string;
  description: string;
  category: Types.ObjectId;
  status: ComplaintStatus;
  priority: "low" | "medium" | "high" | "urgent";
  user: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  location?: string;
  dueDate?: Date;
  escalated?: boolean;
  internalNotes: {
    author: Types.ObjectId;
    note: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed", "archived"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  location: { type: String },
  dueDate: { type: Date },
  escalated: { type: Boolean, default: false },
  internalNotes: [
    {
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      note: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ComplaintSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Complaint = mongoose.model<IComplaint>(
  "Complaint",
  ComplaintSchema,
);
