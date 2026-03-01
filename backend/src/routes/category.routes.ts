import { Router } from "express";
import { Category } from "../models/Category";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(category);
});

router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
