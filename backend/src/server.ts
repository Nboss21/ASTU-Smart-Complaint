import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { json, urlencoded } from "express";
import rateLimit from "express-rate-limit";
import path from "path";

import { connectDb } from "./config/db";
import { Category } from "./models/Category";
import { seedInitialKnowledgeBase } from "./services/kbSeed.service";
import authRoutes from "./routes/auth.routes";
import complaintRoutes from "./routes/complaint.routes";
import categoryRoutes from "./routes/category.routes";
import userRoutes from "./routes/user.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import fileRoutes from "./routes/file.routes";
import kbRoutes from "./routes/kb.routes";
import { initSocket } from "./services/socket.service";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

initSocket(io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(morgan("dev"));
app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

const uploadDir = process.env.FILE_UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", uploadDir)));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/kb", kbRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

connectDb()
  .then(() => {
    // Seed default complaint categories if none exist
    Category.countDocuments()
      .then((count) => {
        if (count === 0) {
          const defaultCategories = [
            {
              name: "Academics & Examination",
              description:
                "Issues related to courses, grading, timetables, exams, and academic policies.",
            },
            {
              name: "Facilities & Infrastructure",
              description:
                "Problems with classrooms, labs, libraries, internet, and campus facilities.",
            },
            {
              name: "Hostel & Accommodation",
              description:
                "Concerns about hostel rooms, cleanliness, security, and living conditions.",
            },
            {
              name: "Finance & Fees",
              description:
                "Questions or issues regarding tuition, scholarships, payments, and refunds.",
            },
            {
              name: "Student Services & Welfare",
              description:
                "Support, counseling, extracurriculars, and overall student well-being.",
            },
            {
              name: "Administration & Policy",
              description:
                "Concerns about administrative processes, regulations, and general governance.",
            },
          ];

          Category.insertMany(defaultCategories)
            .then(() => {
              console.log("Seeded default complaint categories");
            })
            .catch((err) => {
              console.error("Failed to seed default complaint categories", err);
            });
        }
      })
      .catch((err) => {
        console.error("Failed to check complaint categories count", err);
      });

    // Seed initial knowledge base content if empty
    void seedInitialKnowledgeBase();

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

export { io };
