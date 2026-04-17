import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  UserPlusIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // State for stats and activities
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    pendingReports: 0,
    systemStatus: "OK",
  });
  const [activities, setActivities] = useState([]);

  // Helper function to get icon based on action
  const getActivityIcon = (action) => {
    switch (action) {
      case 'registered':
        return <UserPlusIcon className="w-4 h-4 text-blue-500" />;
      case 'created':
        return <PlusCircleIcon className="w-4 h-4 text-green-500" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'joined':
        return <UserGroupIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <FlagIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper function to get action text
  const getActionText = (action) => {
    switch (action) {
      case 'registered':
        return 'registered';
      case 'created':
        return 'created';
      case 'approved':
        return 'approved';
      case 'declined':
        return 'declined';
      case 'joined':
        return 'joined';
      default:
        return action;
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/activities");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-maroon mb-6">Dashboard Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <UsersIcon className="w-8 h-8 text-maroon/70" />
          </div>
          <p className="text-3xl font-bold text-maroon">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">+12 this week</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">Active Groups</h3>
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-maroon/70" />
          </div>
          <p className="text-3xl font-bold text-maroon">{stats.activeGroups}</p>
          <p className="text-sm text-gray-500 mt-1">4 new today</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">Pending Reports</h3>
            <FlagIcon className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.pendingReports}</p>
          <p className="text-sm text-gray-500 mt-1">Requires attention</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">System Status</h3>
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                stats.systemStatus === "OK" ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>
          <p
            className={`text-3xl font-bold ${
              stats.systemStatus === "OK" ? "text-green-600" : "text-red-600"
            }`}
          >
            {stats.systemStatus}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.systemStatus === "OK" ? "All systems normal" : "Issues detected"}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-maroon mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/manage-users")}
            className="bg-maroon text-white px-4 py-3 rounded-lg hover:brightness-110 transition font-medium flex items-center justify-center gap-2"
          >
            <UsersIcon className="w-5 h-5" />
            Manage Users
          </button>
          <button
            onClick={() => navigate("/admin/manage-groups")}
            className="bg-gold text-maroon px-4 py-3 rounded-lg hover:brightness-110 transition font-medium flex items-center justify-center gap-2"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            View Groups
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-maroon mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            activities.map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <span className="text-maroon">
                        {activity.user_first} {activity.user_last}
                      </span>{" "}
                      <span className="text-gray-600">
                        {getActionText(activity.action)}
                      </span>{" "}
                      {activity.target && (
                        <span className="font-semibold text-gray-700">
                          "{activity.target}"
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(activity.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
