// study-group-backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Import Database Pool
import { pool } from "./config/db.js"; 
import { setIO } from "./utils/admin/socket.js"; 

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import schedulesRoutes from "./routes/schedules.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import groupAdminRoutes from "./routes/admin/groupAdminRoutes.js";
import userAdminRoutes from "./routes/admin/userAdminRoutes.js";
import activityRoutes from "./routes/admin/activityRoutes.js";
import notificationRoutes from "./routes/admin/notificationRoutes.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/userRoutes.js";
import notifRoutes from "./routes/notifs.js";
import announcementRoutes from "./routes/announcements.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";
import adminSettingsRoutes from "./routes/admin/adminSettingsRoutes.js";
import testUserRoutes from "./routes/admin/testUserRoutes.js";
import tempFixRoutes from "./routes/temp-fix.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Multer Setup (Local Uploads) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Local Upload Endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  // Use the Backend's own domain instead of localhost:5000
  const protocol = req.protocol;
  const host = req.get('host');
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  res.json({ fileUrl, filename: req.file.originalname });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Study Group Backend API is running!",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      groups: "/api/group",
      calendar: "/api/calendar",
      admin: "/api/admin",
      users: "/api/users"
    }
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleRoutes);
app.use('/api/password', passwordRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/group", groupRoutes);          // group info & join
app.use("/api/calendar", calendarRoutes);     // schedules / calendar
app.use("/api/schedules", schedulesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", groupAdminRoutes);
app.use("/api/admin", adminSettingsRoutes);
app.use("/api/admin", testUserRoutes);
app.use("/api/user", userAdminRoutes);
app.use("/api/admin/activities", activityRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifs", notifRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/temp", tempFixRoutes);

// === Socket.io Setup ===
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

// Initialize socket for admin notifications
setIO(io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });

  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User ${socket.id} joined group_${groupId}`);
  });

  socket.on("send_message", async ({ groupId, sender, text, fileLink }) => {
    try {
      // 1. Save to DB
      const [result] = await pool.execute(
        `INSERT INTO group_messages (group_id, sender_id, text, file_link, time)
         VALUES (?, ?, ?, ?, NOW())`,
        [groupId, sender, text || null, fileLink || null]
      );

      const [newMsg] = await pool.execute(
        `SELECT 
          gm.id, 
          gm.group_id, 
          gm.sender_id,
          gm.text, 
          gm.file_link AS fileLink, 
          gm.time, 
          u.username AS sender_name
         FROM group_messages gm
         JOIN users u ON gm.sender_id = u.id
         WHERE gm.id = ?`,
        [result.insertId]
      );

      // 3. Broadcast
      io.to(`group_${groupId}`).emit("receive_message", {
        groupId: parseInt(groupId),
        message: newMsg[0],
      });

    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  // 🔹 Real-time schedule listener
  socket.on("schedule_created", (schedule) => {
    if (!schedule.groupId) return;
    socket.broadcast.to(`group_${schedule.groupId}`).emit("new_schedule", schedule);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
}); // <-- this closes io.on("connection")

// Export io instance for use in other modules
export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));