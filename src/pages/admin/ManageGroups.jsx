// src/pages/admin/ManageGroups.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { CheckCircleIcon, XCircleIcon, UsersIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import PromptModal from "../../components/admin/PromptModal.jsx";

export default function ManageGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    approved: false,
    declined: false,
  });

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
    const res = await axios.get("http://localhost:5000/api/group/all"); // ← Show ALL
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

  const socket = io("http://localhost:5000");

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

  // When any admin approves/declines — refresh everyone
  socket.on("groupStatusChanged", () => {
    fetchGroups();
  });

  return () => socket.disconnect();
}, []);

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
    await axios.patch(`http://localhost:5000/api/admin/approve/${confirmModal.groupId}`);
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
    await axios.patch(`http://localhost:5000/api/admin/decline/${promptModal.groupId}`, { remarks });
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

  const renderRows = (groupArray, status) => {
    if (!expandedSections[status]) return null;
    return groupArray.map((group) => (
      <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
        <td className="px-6 py-4">{group.group_name}</td>
        <td className="px-6 py-4">{group.course} • {group.location}</td>
        <td className="px-6 py-4">{group.creator_name || group.created_by}</td>
        <td className="px-6 py-4">{group.current_members || 0} / {group.size}</td>
        <td className="px-6 py-4">
          {group.status === "pending" && <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Pending</span>}
          {group.status === "approved" && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Approved</span>}
          {group.status === "declined" && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">Declined</span>}
          {group.status === "declined" && group.remarks && <p className="text-sm text-red-500 mt-1">Remark: {group.remarks}</p>}
        </td>
        <td className="px-6 py-4 flex justify-center gap-2">
          {group.status === "pending" && (
            <>
              <button onClick={() => handleApprove(group.id, group.group_name)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition">
                <CheckCircleIcon className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => handleDecline(group.id, group.group_name)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-red-700 transition">
                <XCircleIcon className="w-4 h-4" /> Decline
              </button>
            </>
          )}
          {group.status === "approved" && <span className="text-green-700 font-medium">✔</span>}
          {group.status === "declined" && <span className="text-red-700 font-medium">✖</span>}
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-maroon mb-4 flex items-center gap-3">
          <UsersIcon className="w-10 h-10" /> Manage Study Groups
        </h1>

        {/* Search / Filter */}
        <div className="mb-4 flex items-center gap-3">
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

        <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Group Name</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Course / Location</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Creator</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Members</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Pending Section */}
            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("pending")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-yellow-800 flex justify-between items-center">
                Pending Approval ({pending.length})
                {expandedSections.pending ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(pending, "pending")}

            {/* Approved Section */}
            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("approved")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-green-800 flex justify-between items-center">
                Approved ({approved.length})
                {expandedSections.approved ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(approved, "approved")}

            {/* Declined Section */}
            <tr className="bg-gray-50 cursor-pointer" onClick={() => toggleSection("declined")}>
              <td colSpan={6} className="px-6 py-3 font-semibold text-red-800 flex justify-between items-center">
                Declined ({declined.length})
                {expandedSections.declined ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </td>
            </tr>
            {renderRows(declined, "declined")}
          </tbody>
        </table>

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
