import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Notification } from "../models/Notification";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const notifications = await Notification.find({ user: req.user!.id }).sort({
    createdAt: -1,
  });
  res.json(notifications);
});

router.put("/:id/read", authenticate, async (req: AuthRequest, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { read: true },
    { new: true },
  );
  res.json(notif);
});

router.put("/read-all", authenticate, async (req: AuthRequest, res) => {
  await Notification.updateMany(
    { user: req.user!.id, read: false },
    { read: true },
  );
  res.status(204).send();
});

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user!.id });
  res.status(204).send();
});

export default router;
