import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Complaint } from "../models/Complaint";
import { Attachment } from "../models/Attachment";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const total = await Complaint.countDocuments();
    const open = await Complaint.countDocuments({ status: "open" });
    const resolved = await Complaint.countDocuments({ status: "resolved" });
    const attachments = await Attachment.countDocuments();
    res.json({ total, open, resolved, attachments });
  },
);

router.get(
  "/complaints-by-category",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const agg = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    res.json(agg);
  },
);

router.get(
  "/resolution-rate",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: "resolved" });
    res.json({ resolutionRate: total ? resolved / total : 0 });
  },
);

router.get(
  "/timeline",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const data = await Complaint.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  },
);

router.get(
  "/export",
  authenticate,
  authorize(["staff", "admin"]),
  async (_req, res) => {
    const complaints = await Complaint.find();
    res.json(complaints); // Placeholder; could be turned into CSV/PDF
  },
);

export default router;
