import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Attachment } from "../models/Attachment";
import { Complaint } from "../models/Complaint";

const router = Router();

// List attachments for a specific complaint so admins and owners can inspect uploads
router.get(
  "/complaint/:complaintId",
  authenticate,
  async (req: AuthRequest, res) => {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    const isOwner = complaint.user.toString() === req.user!.id;
    const isPrivileged =
      req.user!.role === "staff" || req.user!.role === "admin";
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const attachments = await Attachment.find({
      complaint: complaint._id,
    }).select("fileName fileSize mimeType createdAt");
    res.json(attachments);
  },
);

router.get(
  "/:complaintId/:fileId",
  authenticate,
  async (req: AuthRequest, res) => {
    const attachment = await Attachment.findById(req.params.fileId);
    if (
      !attachment ||
      attachment.complaint.toString() !== req.params.complaintId
    ) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${attachment.fileName}"`,
    );
    res.send(attachment.data);
  },
);

router.delete("/:fileId", authenticate, async (req: AuthRequest, res) => {
  const attachment = await Attachment.findById(req.params.fileId);
  if (!attachment) return res.status(404).json({ message: "File not found" });
  await attachment.deleteOne();
  res.status(204).send();
});

export default router;
