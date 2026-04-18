import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRealtime } from "../../context/RealtimeContext";

export default function UserDashboard() {
  const navigate = useNavigate();
  // TEMP: hardcoded current user ID
  const currentUserId = 25;

  const [userGroups, setUserGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]); // approved groups
  const [pendingRequests, setPendingRequests] = useState([]); // pending approval

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchGroups = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id;

      if (!userId) {
        console.log("No user logged in");
        return;
      }

      const [allRes, myRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/group/list`),
        axios.get(`${API_BASE_URL}/api/group/my-groups/${userId}`)
      ]);

      const approvedGroups = allRes.data.data || [];
      const myCreatedGroups = myRes.data.data || [];

      // 🔥 FILTER OUT GROUPS YOU CREATED
      const filteredGroups = approvedGroups.filter(g => g.created_by !== userId);

      // Set state
      setAllGroups(filteredGroups);      // AVAILABLE groups
      setUserGroups(myCreatedGroups);    // CREATED groups

      // Joined groups
      const joinedRes = await axios.get(`${API_BASE_URL}/api/group/my-joined/${userId}`);
      setJoinedGroups(joinedRes.data.data?.map(g => g.id) || []);

    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Real-time updates are handled via RealtimeContext
  // The socket events in RealtimeContext will automatically trigger refreshes

  // Real-time updates are handled via RealtimeContext
  // No direct socket usage needed here

  // Join group
const handleJoinGroup = async (groupId) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = currentUser?.id;

    if (!userId) return toast.error("You must be logged in to join a group.");

    // Include groupId in the POST body
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const res = await axios.post(`${API_BASE_URL}/api/group/join`, {
      groupId,
      userId
    });

if (res.status === 200) {
  toast.success("Join request sent! Waiting for creator approval.");
  setPendingRequests(prev => [...prev, groupId]); // ← ADD THIS LINE
} else {
      toast.error(res.data.message || "Failed to join group"); // e.g., "You are already in this group"
    }
  } catch (err) {
    console.error("Failed to join group:", err);
    toast.error("Failed to send join request. Please try again.");
  }
};


  // Render
  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row gap-0">

        {/* Main Content - Available Groups */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#800000] tracking-tight">
              Available Study Groups
            </h1>
            <button
              onClick={() => navigate("/create-group")}
              className="bg-[#800000] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-[#6b0000] transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span> Create New Group
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {allGroups.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 text-lg">No active study groups available at the moment.</p>
              </div>
            ) : (
              allGroups.map(g => {
                const isFull = g.current_members >= g.size;
                return (
                  <div
                    key={g.id}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-[#800000] group-hover:text-[#6b0000] transition-colors">
                          {g.group_name}
                        </h3>
                        <p className="text-[#FFD700] font-medium text-sm mt-0.5">{g.topic}</p>
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                        {g.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                          {g.course}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                          {g.location}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Size: <strong className="text-gray-800">{g.size}</strong>
                        </span>
                        <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                          {g.size - g.current_members} spot{g.size - g.current_members !== 1 ? 's' : ''} left
                        </span>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        disabled={isFull}
                        onClick={() => {
                          if (joinedGroups.includes(g.id)) {
                            navigate(`/group/${g.id}`);
                          } else {
                            handleJoinGroup(g.id);
                          }
                        }}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          isFull
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#FFD700] to-[#e6c200] text-[#800000] shadow-md hover:shadow-lg transform hover:scale-105"
                        }`}
                      >
                        {isFull
                          ? "Group Full"
                          : joinedGroups.includes(g.id)
                            ? "Enter Group"
                            : pendingRequests.includes(g.id)
                              ? "Pending Approval"
                              : "Join This Group"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

{/* Sidebar - Your Created Groups */}
<aside className="w-full lg:w-96 p-8 bg-gradient-to-b from-[#800000]/5 to-[#800000]/10 border-l border-gray-200 overflow-y-auto scrollbar-hide">
  <h3 className="text-2xl font-bold text-[#800000] mb-6 tracking-tight">
    Your Created Groups
  </h3>

  <div className="space-y-6">
    {userGroups.length === 0 ? (
      <div className="text-center py-12 bg-white/70 rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">You haven’t created any groups yet.</p>
        <p className="text-sm text-gray-400 mt-2">Click the button above to get started!</p>
      </div>
    ) : (
      userGroups.map(g => (
        <div
          key={g.id}
          className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
            g.status === "declined" ? "border-red-400 opacity-90" : "border-gray-200"
          }`}
        >
          <div className="p-5 space-y-3 bg-gradient-to-br from-[#800000]/5 to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg text-[#800000]">{g.group_name}</h4>
                <p className="text-[#FFD700] font-medium text-sm mt-0.5">{g.topic}</p>
              </div>
              {g.status === "declined" && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                  Declined
                </span>
              )}
              {g.status === "pending" && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                  Pending
                </span>
              )}
              {g.status === "approved" && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                  Active
                </span>
              )}
            </div>

            <p className="text-gray-700 text-sm leading-relaxed">{g.description}</p>

            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                Course
                {g.course}
              </span>
              <span className="flex items-center gap-1">
                Location
                {g.location}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-600">
                Members: <strong className="text-[#800000]">{g.current_members}/{g.size}</strong>
              </span>
              {g.status === "approved" && (
                <span className="text-green-600 text-xs font-bold">Active</span>
              )}
              {g.status === "pending" && (
                <span className="text-yellow-600 text-xs font-bold">Waiting for approval</span>
              )}
              {g.status === "declined" && (
                <span className="text-red-600 text-xs font-bold">Declined by Admin</span>
              )}
            </div>

            {g.status === "declined" && g.remarks && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
                <strong>Reason:</strong> {g.remarks}
              </div>
            )}
          </div>

<div className="px-5 pb-5">
  <button
    onClick={() => {
      if (g.status !== "declined") {
        console.log("Navigating to group:", g); // ✅ logs the group safely
        navigate(`/group/${g.id}`); // navigate to JoinViewPage
      }
    }}
    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
      g.status === "declined"
        ? "bg-gray-400 text-white cursor-not-allowed"
        : "bg-[#800000] text-white hover:bg-[#6b0000] shadow-md hover:shadow-lg transform hover:scale-105"
    }`}
    disabled={g.status === "declined"} // prevents clicking if declined
  >
    {g.status === "declined" ? "Declined – Cannot Enter" : "View Group Details"}
  </button>
</div>

        </div>
      ))
    )}
  </div>
</aside>
      </div>
    </div>
  );
}
