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
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Convert to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    const startISO = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const endISO = endDate.toISOString().slice(0, 19).replace('T', ' ');

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

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.execute(
      "DELETE FROM schedules WHERE id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Delete schedule error:", err);
    res.status(500).json({ message: "Failed to delete schedule" });
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


