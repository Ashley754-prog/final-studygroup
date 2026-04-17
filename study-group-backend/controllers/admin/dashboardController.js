import { pool } from "../../config/db.js";

// GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const [users] = await pool.execute("SELECT COUNT(*) AS totalUsers FROM users");

    // Active groups
    const [activeGroups] = await pool.execute(
      "SELECT COUNT(*) AS activeGroups FROM study_groups WHERE status = 'approved'"
    );

    // Pending reports
    const [pendingReports] = await pool.execute(
      "SELECT COUNT(*) AS pendingReports FROM reports WHERE status = 'pending'"
    );

    res.json({
      totalUsers: users[0].totalUsers,
      activeGroups: activeGroups[0].activeGroups,
      pendingReports: pendingReports[0].pendingReports,
      systemStatus: "OK" // you can calculate real system status if needed
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: err.message });
  }
};
