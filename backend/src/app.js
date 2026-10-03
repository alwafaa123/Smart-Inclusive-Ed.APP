const express = require("express");
const cors = require("cors");
const { pool } = require("./config/database");
const sessionMiddleware = require("./config/session");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const classRoutes = require("./routes/classRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const teacherNotificationRoutes = require("./routes/teacherNotificationRoutes");

const { startDeadlineReminderJob } = require("./jobs/deadlineReminderJob");

const app = express();

// ─── Middleware global ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(sessionMiddleware);

// ─── Health checks (tidak butuh auth) ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Inclusive Ed API berjalan!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    application: "Smart Inclusive Ed",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/database", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      success: true,
      database: "connected",
      message: "Database MySQL berhasil terhubung.",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({
      success: false,
      database: "disconnected",
      message: "Database tidak dapat diakses.",
    });
  }
});

// ─── Routes API ───────────────────────────────────────────────────────────────
// PENTING: authRoutes harus didaftarkan SEBELUM 404 handler.
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/teacher-notifications", teacherNotificationRoutes);

// ─── 404 handler (harus paling bawah) ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
});

// ─── Cron jobs ────────────────────────────────────────────────────────────────
startDeadlineReminderJob();

module.exports = app;
