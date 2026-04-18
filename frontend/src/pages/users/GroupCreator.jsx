import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { ClockIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function GroupCreator({ currentUserId: propUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId =
    location.state?.currentUserId || propUserId || storedUser?.id;

  const [availableGroups, setAvailableGroups] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [declinedGroups, setDeclinedGroups] = useState([]);
  const [pendingMembersMap, setPendingMembersMap] = useState({}); // { groupId: [{userId, username}, ...] }

  let socket;

const fetchGroups = async () => {
  if (!currentUserId) return;

  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const [allRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/group/all`)
    ]);

    const allGroups = allRes.data.data || [];

    const available = [];
    const pending = [];
    const declined = [];

    allGroups.forEach((group) => {
      const isCreator = Number(group.created_by) === Number(currentUserId);

      if (isCreator) {
        if (group.status === "pending") {
          pending.push({ ...group, remarks: "Waiting for admin approval" });
        } else if (group.status === "declined") {
          declined.push({ ...group, remarks: group.remarks || "No remarks provided" });
        } else if (group.status === "approved") {
          available.push(group); // ← Only once!
        }
      }
    });

    setAvailableGroups(available);
    setPendingGroups(pending);
    setDeclinedGroups(declined);

  } catch (err) {
    console.error("Error loading groups:", err);
  }
};

  const fetchPendingMembers = async () => {
    if (!currentUserId) return;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.get(`${API_BASE_URL}/api/group/pending-members/${currentUserId}`);
      // Expected response: { groupId: [{userId, username}, ...], ... }
      setPendingMembersMap(res.data.data || {});
    } catch (err) {
      console.error("Error fetching pending members:", err);
    }
  };

useEffect(() => {
  if (!currentUserId) return;

  fetchGroups();
  fetchPendingMembers();

  socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

  socket.emit("join_creator", currentUserId);

  // Listen for group status changes (admin approve/decline)
  socket.on("groupStatusChanged", () => {
    fetchGroups();
    fetchPendingMembers();
  });

  // Also listen for the new event (just in case)
  socket.on("groupUpdated", () => {
    fetchGroups();
    fetchPendingMembers();
  });

  // Keep your existing refresh for member approvals
  socket.on("refresh_pending", () => {
    fetchPendingMembers();
    fetchGroups();
  });

  return () => {
    socket.disconnect();
  };
}, [currentUserId]);

const handleApproveMember = async (groupId, user) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    await axios.post(`${API_BASE_URL}/api/group/${groupId}/approve`, { userId: user.userId });
    toast.success(`${user.username} has been approved!`);
    fetchPendingMembers();
    socket.emit("request_approved", {
      userId: user.userId,
      groupId,
      groupName: availableGroups.find(g => g.id === groupId)?.group_name
    });
  } catch (err) {
    console.error(err);
    toast.error("Failed to approve member.");
  }
};

const handleDeclineMember = async (groupId, user) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    await axios.post(`${API_BASE_URL}/api/group/${groupId}/decline`, { userId: user.userId });
    toast.info(`${user.username} has been declined.`);
    fetchPendingMembers();
    socket.emit("request_declined", { userId: user.userId, groupId });
  } catch (err) {
    console.error(err);
    toast.error("Failed to decline member.");
  }
};


  const handleViewGroup = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  const handleEditGroup = (group) => {
    navigate(`/edit-group/${group.id}`, { state: { remarks: group.remarks } });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row gap-0">

        {/* Main Content - Available Groups */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#800000] tracking-tight">
              Your Approved Study Groups
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableGroups.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 text-lg">No approved groups available at the moment.</p>
              </div>
            ) : (
              availableGroups.map(g => (
                <div key={g.id} className="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-[#800000] group-hover:text-[#6b0000] transition-colors">{g.group_name}</h3>
                      <p className="text-[#FFD700] font-medium text-sm mt-0.5">{g.topic}</p>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{g.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">{g.course}</span>
                      <span className="flex items-center gap-1">{g.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Size: <strong className="text-gray-800">{g.size}</strong></span>
                      <span className="font-semibold text-green-600">{g.size - g.current_members} spot{g.size - g.current_members !== 1 ? 's' : ''} left</span>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      onClick={() => handleViewGroup(g.id)}
                      className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#FFD700] to-[#e6c200] text-[#800000] shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      View Group
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Sidebar - Pending & Declined Groups */}
        <aside className="w-full lg:w-96 p-8 bg-gradient-to-b from-[#800000]/5 to-[#800000]/10 border-l border-gray-200 overflow-y-auto scrollbar-hide space-y-8">

          {/* Pending Members */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="w-7 h-7 text-yellow-600" />
              <h3 className="text-2xl font-bold text-[#800000]">Pending Approval</h3>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">{pendingGroups.length}</span>
            </div>

            {pendingGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-white/70 rounded-2xl border border-dashed border-gray-300">
                No pending groups
              </p>
            ) : (
              pendingGroups.map(g => (
                <div key={g.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 space-y-2">
                  <h4 className="font-bold text-lg text-[#800000]">{g.group_name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{g.course} • {g.topic}</p>
                  <p className="text-sm text-gray-600">{g.location} • {g.current_members}/{g.size} members</p>

                  {pendingMembersMap[g.id]?.length ? (
                    pendingMembersMap[g.id].map(user => (
                      <div key={user.userId} className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium">{user.username}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveMember(g.id, user)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            <CheckCircleIcon className="w-4 h-4 inline mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleDeclineMember(g.id, user)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            <XCircleIcon className="w-4 h-4 inline mr-1" /> Decline
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-yellow-800 mt-2 italic flex items-center gap-1">
                      <ClockIcon className="w-5 h-5" /> Waiting for admin approval...
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Declined Groups */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <XCircleIcon className="w-7 h-7 text-red-600" />
              <h3 className="text-2xl font-bold text-[#800000]">Declined Groups</h3>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">{declinedGroups.length}</span>
            </div>

            {declinedGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-white/70 rounded-2xl border border-dashed border-gray-300">
                No declined groups
              </p>
            ) : (
              declinedGroups.map(g => (
                <div key={g.id} className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
                  <h4 className="font-bold text-lg text-[#800000]">{g.group_name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{g.course} • {g.topic}</p>
                  <p className="text-sm text-gray-600">{g.location} • {g.current_members}/{g.size} members</p>
                  {g.remarks && <p className="text-sm text-red-700 mt-2 italic">Reason: "{g.remarks}"</p>}
                  <button
                    onClick={() => handleEditGroup(g)}
                    className="mt-3 w-full py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                  >
                    Edit Details
                  </button>
                </div>
              ))
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
