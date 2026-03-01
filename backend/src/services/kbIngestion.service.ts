import {
  KnowledgeBaseDocument,
  IKnowledgeBaseDocument,
  KnowledgeSourceType,
} from "../models/KnowledgeBaseDocument";
import { getEmbedding } from "./chatbot.service";

export interface IngestTextOptions {
  baseTitle: string;
  content: string;
  sourceType: KnowledgeSourceType;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  maxChunkChars?: number;
  overlapChars?: number;
}

const defaultMaxChunk = 1500;
const defaultOverlap = 200;

function chunkText(
  text: string,
  maxChars: number = defaultMaxChunk,
  overlap: number = defaultOverlap,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  const len = normalized.length;

  while (start < len) {
    let end = Math.min(start + maxChars, len);
    let chunk = normalized.slice(start, end);

    if (end < len) {
      const lastNewline = chunk.lastIndexOf("\n\n");
      const lastPeriod = chunk.lastIndexOf(". ");
      const splitAt = Math.max(lastNewline, lastPeriod);
      if (splitAt > maxChars * 0.5) {
        end = start + splitAt + 1;
        chunk = normalized.slice(start, end);
      }
    }

    chunks.push(chunk.trim());
    if (end >= len) break;
    start = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
}

export async function ingestTextAsChunks(options: IngestTextOptions) {
  const {
    baseTitle,
    content,
    sourceType,
    category,
    tags = [],
    isPublic = true,
    maxChunkChars = defaultMaxChunk,
    overlapChars = defaultOverlap,
  } = options;

  const chunks = chunkText(content, maxChunkChars, overlapChars);
  if (!chunks.length) return [] as IKnowledgeBaseDocument[];

  const created: IKnowledgeBaseDocument[] = [];
  const total = chunks.length;

  for (let idx = 0; idx < total; idx++) {
    const chunk = chunks[idx];
    const title =
      total === 1 ? baseTitle : `${baseTitle} (part ${idx + 1}/${total})`;
    const embedding = await getEmbedding(`${title}\n\n${chunk.slice(0, 3000)}`);

    const doc = await KnowledgeBaseDocument.create({
      title,
      content: chunk,
      sourceType,
      category,
      tags,
      metadata: { isPublic },
      embedding,
      embeddingId: undefined,
    } as Partial<IKnowledgeBaseDocument>);

    doc.embeddingId = doc._id.toString();
    await doc.save();
    created.push(doc);
  }

  return created;
}
