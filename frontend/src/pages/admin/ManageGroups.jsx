// src/pages/admin/ManageGroups.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon, UsersIcon, ClockIcon } from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import PromptModal from "../../components/admin/PromptModal.jsx";
import { useRealtime } from "../../context/RealtimeContext";

export default function ManageGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    groupId: null,
    action: null,
    groupName: ""
  });

  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    groupId: null,
    groupName: ""
  });

const fetchGroups = async () => {
  setLoading(true);
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const res = await axios.get(`${API_BASE_URL}/api/group/all`); // ← Show ALL
    const groupList = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];
    
    // Ensure pending groups are correctly marked
    const mappedGroups = groupList.map(g => ({
      ...g,
      status: g.status || "pending"
    }));

    setGroups(mappedGroups);
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch groups");
    setGroups([]);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  fetchGroups(); // initial load
}, []);

// Real-time updates using RealtimeContext
const { socket } = useRealtime();

useEffect(() => {
  if (!socket) return;

  // NEW GROUPS APPEAR INSTANTLY IN PENDING
  socket.on("newPendingGroup", (newGroup) => {
    setGroups(prev => {
      // Prevent duplicates
      if (prev.some(g => g.id === newGroup.id)) return prev;
      // Add to the top of pending
      toast.success(`New group created: ${newGroup.group_name}`);
      return [newGroup, ...prev];
    });
  });

  // GROUP STATUS CHANGES (approve/decline)
  socket.on("group_updated", (data) => {
    toast.info(`Group "${data.group_name}" updated`);
    fetchGroups();
  });

  socket.on("groupStatusChanged", () => {
    fetchGroups();
  });

  return () => {
    if (socket) {
      socket.off("newPendingGroup");
      socket.off("group_updated");
      socket.off("groupStatusChanged");
    }
  };
}, [socket]);

const handleApprove = async (groupId, groupName) => {
  setConfirmModal({
    isOpen: true,
    groupId,
    action: "approve",
    groupName
  });
};

const handleDecline = async (groupId, groupName) => {
  setPromptModal({
    isOpen: true,
    groupId,
    groupName
  });
};

const confirmApprove = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    await axios.patch(`${API_BASE_URL}/api/admin/approve/${confirmModal.groupId}`);
    toast.success("Group approved! Creator will receive an email.");
    fetchGroups();
    setConfirmModal({ isOpen: false, groupId: null, action: null, groupName: "" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to approve group");
    setConfirmModal({ isOpen: false, groupId: null, action: null, groupName: "" });
  }
};

const submitDecline = async (remarks) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    await axios.patch(`${API_BASE_URL}/api/admin/decline/${promptModal.groupId}`, { remarks });
    toast.info("Group declined! Creator will receive an email.");
    fetchGroups();
    setPromptModal({ isOpen: false, groupId: null, groupName: "" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to decline group");
    setPromptModal({ isOpen: false, groupId: null, groupName: "" });
  }
};


  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading groups...</div>;

  const filteredGroups = groups.filter((g) => {
    const term = search.toLowerCase();
    return (
      g.group_name.toLowerCase().includes(term) ||
      g.course.toLowerCase().includes(term) ||
      g.location.toLowerCase().includes(term) ||
      (g.creator_name || g.created_by).toLowerCase().includes(term)
    );
  });

  const pending = filteredGroups.filter((g) => g.status === "pending");
  const approved = filteredGroups.filter((g) => g.status === "approved");
  const declined = filteredGroups.filter((g) => g.status === "declined");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-maroon mb-6 flex items-center gap-3">
          <UsersIcon className="w-10 h-10" /> Manage Study Groups
        </h1>

        {/* Search / Filter */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by group, course, location, or creator..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setSearch("")} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
            Clear
          </button>
        </div>

        <div className="space-y-8">
          {/* Pending Groups Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
              <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
                <ClockIcon className="w-6 h-6" />
                Pending Approval ({pending.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Group Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Course</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Location</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Creator</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Members</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No pending groups
                      </td>
                    </tr>
                  ) : (
                    pending.map((group) => (
                      <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{group.group_name}</td>
                        <td className="px-6 py-4">{group.course}</td>
                        <td className="px-6 py-4">{group.location}</td>
                        <td className="px-6 py-4">{group.creator_name || group.created_by}</td>
                        <td className="px-6 py-4">{group.current_members || 0} / {group.size}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleApprove(group.id, group.group_name)} 
                              className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition text-sm"
                            >
                              <CheckCircleIcon className="w-4 h-4" /> Approve
                            </button>
                            <button 
                              onClick={() => handleDecline(group.id, group.group_name)} 
                              className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-red-700 transition text-sm"
                            >
                              <XCircleIcon className="w-4 h-4" /> Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approved Groups Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6" />
                Approved Groups ({approved.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Group Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Course</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Location</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Creator</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Members</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No approved groups
                      </td>
                    </tr>
                  ) : (
                    approved.map((group) => (
                      <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{group.group_name}</td>
                        <td className="px-6 py-4">{group.course}</td>
                        <td className="px-6 py-4">{group.location}</td>
                        <td className="px-6 py-4">{group.creator_name || group.created_by}</td>
                        <td className="px-6 py-4">{group.current_members || 0} / {group.size}</td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                            Approved
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Declined Groups Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
                <XCircleIcon className="w-6 h-6" />
                Declined Groups ({declined.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Group Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Course</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Location</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Creator</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Members</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {declined.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No declined groups
                      </td>
                    </tr>
                  ) : (
                    declined.map((group) => (
                      <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{group.group_name}</td>
                        <td className="px-6 py-4">{group.course}</td>
                        <td className="px-6 py-4">{group.location}</td>
                        <td className="px-6 py-4">{group.creator_name || group.created_by}</td>
                        <td className="px-6 py-4">{group.current_members || 0} / {group.size}</td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                              Declined
                            </span>
                            {group.remarks && (
                              <p className="text-sm text-red-600 mt-2 italic">
                                <strong>Reason:</strong> {group.remarks}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Approval Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, groupId: null, action: null, groupName: "" })}
        onConfirm={confirmApprove}
        title="Approve Study Group"
        message={`Are you sure you want to approve the study group "${confirmModal.groupName}"? The creator will receive an email notification.`}
        confirmText="Approve Group"
        cancelText="Cancel"
        type="info"
      />

      {/* Decline Remarks Modal */}
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ isOpen: false, groupId: null, groupName: "" })}
        onSubmit={submitDecline}
        title="Decline Study Group"
        message={`Please provide a reason for declining the study group "${promptModal.groupName}":`}
        placeholder="Enter reason for declining this group..."
        submitText="Decline Group"
        cancelText="Cancel"
      />
      </div>
    </div>
  );
}
