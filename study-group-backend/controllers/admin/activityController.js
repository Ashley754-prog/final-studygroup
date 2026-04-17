// controllers/admin/activityController.js
import { pool } from "../../config/db.js";

// GET RECENT ADMIN ACTIVITIES
export const getRecentActivities = async (req, res) => {
  try {
    // Get recent activities from different tables
    const [newUsers] = await pool.execute(`
      SELECT 
        u.id,
        u.first_name AS user_first,
        u.last_name AS user_last,
        'registered' as action,
        u.username as target,
        u.created_at
      FROM users u
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY u.created_at DESC
      LIMIT 5
    `);

    const [newGroups] = await pool.execute(`
      SELECT 
        g.id,
        u.first_name AS user_first,
        u.last_name AS user_last,
        'created' as action,
        g.group_name as target,
        g.created_at
      FROM study_groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY g.created_at DESC
      LIMIT 5
    `);

    const [groupStatusChanges] = await pool.execute(`
      SELECT 
        g.id,
        u.first_name AS user_first,
        u.last_name AS user_last,
        CASE 
          WHEN g.status = 'approved' THEN 'approved'
          WHEN g.status = 'declined' THEN 'declined'
          ELSE 'updated'
        END as action,
        g.group_name as target,
        g.updated_at as created_at
      FROM study_groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND g.status != 'pending'
      ORDER BY g.updated_at DESC
      LIMIT 5
    `);

    const [groupJoins] = await pool.execute(`
      SELECT 
        gm.id,
        u.first_name AS user_first,
        u.last_name AS user_last,
        'joined' as action,
        g.group_name as target,
        gm.created_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      JOIN study_groups g ON gm.group_id = g.id
      WHERE gm.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND gm.status = 'approved'
      ORDER BY gm.created_at DESC
      LIMIT 5
    `);

    // Combine all activities and sort by date
    const allActivities = [
      ...newUsers,
      ...newGroups,
      ...groupStatusChanges,
      ...groupJoins
    ];

    // Sort by created_at descending and take latest 10
    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentActivities = allActivities.slice(0, 10);

    // Format the activities for frontend
    const formattedActivities = recentActivities.map(activity => ({
      ...activity,
      user_first: activity.user_first || 'Unknown',
      user_last: activity.user_last || 'User',
      action: activity.action,
      target: activity.target,
      created_at: activity.created_at
    }));
    
    res.json(formattedActivities);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to fetch activities", error: err.message });
  }
};
