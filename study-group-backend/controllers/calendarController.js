// controllers/calendarController.js
import { pool } from "../config/db.js";

export const getGroupSchedules = async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM schedules WHERE groupId = ? ORDER BY start ASC",
      [groupId]
    );

    const schedules = rows.map(s => ({
      ...s,
      attendees: JSON.parse(s.attendees || "[]"),
      meetingType: s.meetingType || "physical",
      meetingLink: s.meetingLink || null
    }));

    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB Error" });
  }
};

export const createGroupSchedule = async (req, res) => {
  const { groupId } = req.params;
  const { title, start, end, location = "Online", description = "", meetingType = "physical" } = req.body;

  if (!title || !start || !end) {
    return res.status(400).json({ success: false, message: "Title, start, and end are required" });
  }

  try {
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    // Generate a simple meeting link for online meetings (without Google Calendar)
    let meetingLink = null;
    if (meetingType === "online") {
      meetingLink = `https://meet.jit.si/StudyGroup-${Date.now()}`;
      console.log("Generated meeting link:", meetingLink);
    }

    const [result] = await pool.execute(
      `INSERT INTO schedules 
       (groupId, title, description, start, end, location, attendees, googleEventId, meetingType, meetingLink)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [groupId, title, description, startISO, endISO, location, "[]", null, meetingType, meetingLink]
    );

    const newSchedule = {
      id: result.insertId,
      groupId: parseInt(groupId),
      title,
      description,
      start: startISO,
      end: endISO,
      location,
      attendees: [],
      googleEventId: null,
      meetingType,
      meetingLink
    };

    // Emit to group
    const io = req.app.get("io");
    if (io) {
      io.to(`group_${groupId}`).emit("new_schedule", newSchedule);
    }

    res.status(201).json({ success: true, schedule: newSchedule });

  } catch (err) {
    console.error("Schedule creation error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create schedule", error: err.message });
  }
};

export const generateMeetLink = async (req, res) => {
  try {
    // Generate a simple Jitsi Meet link (free, no API key needed)
    const meetingLink = `https://meet.jit.si/StudyGroup-${Date.now()}`;
    console.log("Generated meeting link:", meetingLink);
    
    res.json({ meetingLink });
  } catch (err) {
    console.error("Failed to generate meeting link:", err);
    res.status(500).json({ message: "Failed to generate meeting link" });
  }
};


