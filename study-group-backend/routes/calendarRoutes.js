import express from "express";
import { getGroupSchedules, createGroupSchedule, deleteSchedule, generateMeetLink } from "../controllers/calendarController.js";

const router = express.Router();

// Get all schedules for a group
router.get("/group/:groupId", getGroupSchedules);

// Create a schedule for a group
router.post("/group/:groupId", createGroupSchedule);

// Delete a schedule
router.delete("/:id", deleteSchedule);

// Generate a temporary Google Meet link
router.post("/generate-meet", generateMeetLink);

export default router;
