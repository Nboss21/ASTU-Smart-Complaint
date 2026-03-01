import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Attachment } from "../models/Attachment";
import { Complaint } from "../models/Complaint";
import { ingestTextAsChunks } from "./kbIngestion.service";

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text || null;
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || null;
    }

    if (mimeType.startsWith("text/")) {
      const text = buffer.toString("utf8");
      return text || null;
    }

    // For now, skip other types (images, etc.)
    return null;
  } catch {
    return null;
  }
}

export async function ingestAttachmentToKnowledgeBase(attachmentId: string) {
  const attachment = await Attachment.findById(attachmentId);
  if (!attachment) return;

  const complaint = await Complaint.findById(attachment.complaint).populate(
    "category",
  );
  if (!complaint) return;

  const text = await extractTextFromBuffer(attachment.data, attachment.mimeType);
  if (!text || !text.trim()) return;

  const snippet = text.trim();
  const title = `${complaint.title} – ${attachment.fileName}`;
  const categoryName =
    (complaint as any).category?.name || "Complaint Attachment";

  try {
    await ingestTextAsChunks({
      baseTitle: title,
      content: snippet,
      sourceType: "attachment",
      category: categoryName,
      tags: ["attachment", "complaint"],
      isPublic: false,
    });
  } catch (err) {
    console.error("Failed to ingest attachment into knowledge base", err);
  }
}
