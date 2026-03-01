import mongoose, { Schema, Document } from "mongoose";

export interface ISearchAnalytics extends Document {
  query: string;
  timestamp: Date;
  hybridRatioUsed: number;
  resultCount: number;
  responseTimeMs: number;
  userRated: boolean;
  satisfaction: boolean | null;
}

const SearchAnalyticsSchema = new Schema<ISearchAnalytics>({
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  hybridRatioUsed: { type: Number, required: true },
  resultCount: { type: Number, required: true },
  responseTimeMs: { type: Number, required: true },
  userRated: { type: Boolean, default: false },
  satisfaction: { type: Boolean, default: null },
});

export const SearchAnalytics = mongoose.model<ISearchAnalytics>(
  "SearchAnalytics",
  SearchAnalyticsSchema,
);
