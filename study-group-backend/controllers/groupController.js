import { pool } from "../config/db.js";

export const createGroup = async (req, res) => {
  try {
    const { group_name, description, created_by } = req.body;

    const [result] = await pool.query(
      "INSERT INTO groups (group_name, description, created_by) VALUES (?, ?, ?)",
      [group_name, description, created_by]
    );

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group_id: result.insertId
    });

  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const [groups] = await pool.query("SELECT * FROM study_groups ORDER BY created_at DESC");

    return res.status(200).json({ success: true, groups });

  } catch (error) {
    console.error("Get groups error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
