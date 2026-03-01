import {
  KnowledgeBaseDocument,
  IKnowledgeBaseDocument,
} from "../models/KnowledgeBaseDocument";
import { getEmbedding } from "./chatbot.service";

export interface RetrievedSource {
  documentId: string;
  title: string;
  contentSnippet: string;
  relevance: number;
  sourceType: string;
  category?: string;
}

export interface HybridSearchOptions {
  hybridRatio?: number; // 0.0 keyword only, 1.0 vector only
  k?: number;
}

const DEFAULT_K = 8;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

const buildSnippet = (content: string, maxLen = 300): string => {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + "...";
};

export const hybridRetrieve = async (
  query: string,
  options: HybridSearchOptions = {},
): Promise<{ sources: RetrievedSource[]; usedHybridRatio: number }> => {
  const hybridRatio = clamp(options.hybridRatio ?? 0.7, 0, 1);
  const k = options.k ?? DEFAULT_K;

  const [queryEmbedding, allDocs] = await Promise.all([
    getEmbedding(query),
    KnowledgeBaseDocument.find().lean<IKnowledgeBaseDocument[]>(),
  ]);

  if (!allDocs.length) {
    return { sources: [], usedHybridRatio: hybridRatio };
  }

  // Vector scoring
  const vectorScores: Record<string, number> = {};
  for (const d of allDocs) {
    if (!d.embedding || !d.embedding.length) continue;
    vectorScores[d._id.toString()] = cosineSimilarity(
      queryEmbedding,
      d.embedding,
    );
  }

  // Keyword scoring via Mongo text search, best-effort
  const keywordScores: Record<string, number> = {};
  try {
    const keywordDocs = await KnowledgeBaseDocument.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } },
    ).lean<any[]>();
    for (const d of keywordDocs) {
      const id = d._id?.toString?.();
      if (!id || typeof d.score !== "number") continue;
      keywordScores[id] = d.score;
    }
  } catch {
    // Text index may not exist yet; ignore lexical part
  }

  // Normalize scores
  const normalize = (
    scores: Record<string, number>,
  ): Record<string, number> => {
    const values = Object.values(scores);
    if (!values.length) return {};
    const max = Math.max(...values);
    if (!max) return scores;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      out[k] = v / max;
    }
    return out;
  };

  const normVector = normalize(vectorScores);
  const normKeyword = normalize(keywordScores);

  const combined: { id: string; score: number }[] = [];
  const seen = new Set<string>();

  for (const id of new Set([
    ...Object.keys(normVector),
    ...Object.keys(normKeyword),
  ])) {
    const sv = normVector[id] ?? 0;
    const sk = normKeyword[id] ?? 0;
    const score = hybridRatio * sv + (1 - hybridRatio) * sk;
    combined.push({ id, score });
    seen.add(id);
  }

  // If one side empty, effectively fall back
  if (!Object.keys(normKeyword).length && Object.keys(normVector).length) {
    combined.sort(
      (a, b) => (vectorScores[b.id] ?? 0) - (vectorScores[a.id] ?? 0),
    );
  } else {
    combined.sort((a, b) => b.score - a.score);
  }

  const topIds = combined.slice(0, k).map((c) => c.id);
  const docsById: Record<string, IKnowledgeBaseDocument> = {};
  for (const d of allDocs) {
    const id = d._id.toString();
    if (topIds.includes(id)) docsById[id] = d;
  }

  const sources: RetrievedSource[] = topIds
    .map((id) => {
      const d = docsById[id];
      if (!d) return null;
      const vecScore = vectorScores[id] ?? 0;
      const keyScore = keywordScores[id] ?? 0;
      const hybridScore = hybridRatio * vecScore + (1 - hybridRatio) * keyScore;
      return {
        documentId: id,
        title: d.title,
        contentSnippet: buildSnippet(d.content),
        relevance: hybridScore,
        sourceType: d.sourceType,
        category: d.category,
      } as RetrievedSource;
    })
    .filter((x): x is RetrievedSource => x !== null);

  return { sources, usedHybridRatio: hybridRatio };
};
