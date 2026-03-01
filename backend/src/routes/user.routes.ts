import { Router } from "express";
import { User } from "../models/User";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize(["admin"]), async (_req, res) => {
  const users = await User.find().select("-passwordHash");
  res.json(users);
});

router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  // For simplicity, assume password already hashed or use default; in real-world, reuse auth registration logic
  const user = await User.create(req.body);
  res.status(201).json(user);
});

router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).select("-passwordHash");
  res.json(user);
});

router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

router.put(
  "/:id/role",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-passwordHash");
    res.json(user);
  },
);

export default router;
