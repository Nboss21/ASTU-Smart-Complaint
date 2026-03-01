import { Router } from "express";
import multer from "multer";
import { authenticate, AuthRequest, authorize } from "../middleware/auth";
import { Complaint } from "../models/Complaint";
import { User } from "../models/User";
import { Attachment } from "../models/Attachment";
import { StatusHistory } from "../models/StatusHistory";
import { ingestAttachmentToKnowledgeBase } from "../services/attachmentIngestion.service";
import { Notification } from "../models/Notification";
import {
  sendComplaintCreatedEmail,
  sendComplaintStatusChangedEmail,
} from "../services/email.service";
import { sendNotification } from "../services/socket.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const filter: any = {};
  if (req.user!.role === "user") {
    // Students see only their own complaints
    filter.user = req.user!.id;
  } else if (req.user!.role === "staff") {
    // Staff see only complaints explicitly assigned to them
    filter.assignedTo = req.user!.id;
  }
  const complaints = await Complaint.find(filter).populate(
    "category user assignedTo",
  );
  res.json(complaints);
});

router.post(
  "/",
  authenticate,
  upload.array("files"),
  async (req: AuthRequest, res) => {
    const { title, description, categoryId, priority, location } = req.body;

    if (!categoryId) {
      return res
        .status(400)
        .json({ message: "Category is required to file a complaint" });
    }

    // basic SLA-style due date based on priority
    const prio = (priority as string) || "medium";
    const now = new Date();
    const daysByPriority: Record<string, number> = {
      low: 7,
      medium: 5,
      high: 3,
      urgent: 1,
    };
    const dueDate = new Date(
      now.getTime() + (daysByPriority[prio] ?? 5) * 24 * 60 * 60 * 1000,
    );

    const complaint = await Complaint.create({
      title,
      description,
      category: categoryId,
      priority: prio,
      user: req.user!.id,
      location,
      dueDate,
    });

    const files = (req.files || []) as Express.Multer.File[];
    for (const f of files) {
      const attachment = await Attachment.create({
        complaint: complaint._id,
        fileName: f.originalname,
        fileSize: f.size,
        mimeType: f.mimetype,
        data: f.buffer,
      });
      // Best-effort ingestion of supported file types into the knowledge base
      void ingestAttachmentToKnowledgeBase(attachment._id.toString());
    }

    // best-effort in-app notifications (user + admins) and email
    try {
      // notify the user who filed the complaint
      await Notification.create({
        user: req.user!.id,
        message: `Your complaint "${complaint.title}" has been submitted.`,
        type: "complaint_created",
      });
      sendNotification(req.user!.id, {
        message: `Your complaint "${complaint.title}" has been submitted.`,
        type: "complaint_created",
      });

      // notify all admins that a new complaint has been filed
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          message: `New complaint "${complaint.title}" has been submitted.`,
          type: "complaint_created_admin",
        });
        sendNotification(admin._id.toString(), {
          message: `New complaint "${complaint.title}" has been submitted.`,
          type: "complaint_created_admin",
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to create complaint notifications", err);
    }

    if ((req.user as any)?.email) {
      void sendComplaintCreatedEmail((req.user as any).email, complaint.title);
    }

    res.status(201).json(complaint);
  },
);

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    "category user assignedTo",
  );
  if (!complaint) return res.status(404).json({ message: "Not found" });
  if (req.user!.role === "user") {
    const ownerId =
      (complaint.user as any)?._id?.toString() ?? complaint.user.toString();
    if (ownerId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
  } else if (req.user!.role === "staff") {
    const assigneeId =
      (complaint.assignedTo as any)?._id?.toString() ??
      (complaint.assignedTo ? complaint.assignedTo.toString() : null);
    if (!assigneeId || assigneeId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }
  res.json(complaint);
});

// Staff/admin: get metrics for SLA-style tracking on assigned tickets
router.get(
  "/staff/metrics",
  authenticate,
  authorize(["staff", "admin"]),
  async (req: AuthRequest, res) => {
    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000); // next 48h
    const baseFilter: any = {
      assignedTo: req.user!.id,
      status: { $in: ["open", "in_progress"] },
    };

    const [overdue, upcoming, open] = await Promise.all([
      Complaint.countDocuments({
        ...baseFilter,
        dueDate: { $lt: now },
      }),
      Complaint.countDocuments({
        ...baseFilter,
        dueDate: { $gte: now, $lte: soon },
      }),
      Complaint.countDocuments(baseFilter),
    ]);

    res.json({ overdue, upcoming, open });
  },
);

router.put(
  "/:id/status",
  authenticate,
  authorize(["staff", "admin"]),
  async (req: AuthRequest, res) => {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate("user");
    if (!complaint) return res.status(404).json({ message: "Not found" });
    const oldStatus = complaint.status;
    complaint.status = status;
    await complaint.save();
    await StatusHistory.create({
      complaint: complaint._id,
      oldStatus,
      newStatus: status,
      changedBy: req.user!.id,
      remarks,
    });

    // in-app + push notification for owner
    const owner: any = complaint.user;
    if (owner?._id) {
      try {
        await Notification.create({
          user: owner._id,
          message: `Status of your complaint "${complaint.title}" changed from ${oldStatus} to ${status}.`,
          type: "complaint_status_changed",
        });
        sendNotification(owner._id.toString(), {
          message: `Status of your complaint "${complaint.title}" changed to ${status}.`,
          type: "complaint_status_changed",
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to create complaint status notification", err);
      }
      if (owner.email) {
        void sendComplaintStatusChangedEmail(owner.email, complaint.title, status);
      }
    }

    res.json(complaint);
  },
);

router.put(
  "/:id/assign",
  authenticate,
  authorize(["admin"]),
  async (req: AuthRequest, res) => {
    const { assignedTo } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true },
    );
    if (!complaint) return res.status(404).json({ message: "Not found" });
    res.json(complaint);
  },
);

// Staff/admin internal notes on a complaint (not visible to end users)
router.post(
  "/:id/notes",
  authenticate,
  authorize(["staff", "admin"]),
  async (req: AuthRequest, res) => {
    const { note } = req.body as { note?: string };
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });
    (complaint.internalNotes as any).push({
      author: req.user!.id as any,
      note: note.trim(),
      createdAt: new Date(),
    });
    await complaint.save();
    const created = complaint.internalNotes[complaint.internalNotes.length - 1];
    res.status(201).json(created);
  },
);

router.get(
  "/:id/notes",
  authenticate,
  authorize(["staff", "admin"]),
  async (req: AuthRequest, res) => {
    const complaint = await Complaint.findById(req.params.id).select(
      "internalNotes",
    );
    if (!complaint) return res.status(404).json({ message: "Not found" });
    res.json(complaint.internalNotes);
  },
);

// Staff can escalate a complaint to admins for extra attention
router.post(
  "/:id/escalate",
  authenticate,
  authorize(["staff"]),
  async (req: AuthRequest, res) => {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { escalated: true },
      { new: true },
    );
    if (!complaint) return res.status(404).json({ message: "Not found" });

    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          message: `Complaint "${complaint.title}" has been escalated by staff.`,
          type: "complaint_escalated",
        });
        sendNotification(admin._id.toString(), {
          message: `Complaint "${complaint.title}" has been escalated by staff.`,
          type: "complaint_escalated",
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to create escalation notifications", err);
    }

    res.json(complaint);
  },
);

router.get("/:id/history", authenticate, async (req: AuthRequest, res) => {
  const history = await StatusHistory.find({ complaint: req.params.id }).sort({
    timestamp: 1,
  });
  res.json(history);
});

router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  async (req: AuthRequest, res) => {
    await Complaint.findByIdAndUpdate(req.params.id, { status: "archived" });
    res.status(204).send();
  },
);

export default router;
