// src/pages/admin/ManageGroups.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon, UsersIcon, ClockIcon, EyeIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import PromptModal from "../../components/admin/PromptModal.jsx";
import { useRealtime } from "../../context/RealtimeContext";

export default function ManageGroups() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  
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

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    group: null,
    members: []
  });

  const [deleteModal, setDeleteModal] = useState({
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
    setFilteredGroups(mappedGroups);
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

// Apply search and filters
useEffect(() => {
  let filtered = [...groups];

  // Apply search filter
  if (searchTerm.trim()) {
    filtered = filtered.filter(group => {
      const searchLower = searchTerm.toLowerCase();
      return (
        group.group_name?.toLowerCase().includes(searchLower) ||
        group.course?.toLowerCase().includes(searchLower) ||
        group.location?.toLowerCase().includes(searchLower) ||
        (group.creator_name || group.created_by)?.toLowerCase().includes(searchLower)
      );
    });
  }

  // Apply date filter
  if (dateFilter !== "all") {
    const now = new Date();
    
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(group => {
          const groupDate = new Date(group.created_at);
          return groupDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(group => {
          const groupDate = new Date(group.created_at);
          return groupDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(group => {
          const groupDate = new Date(group.created_at);
          return groupDate >= monthAgo;
        });
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(group => {
          const groupDate = new Date(group.created_at);
          return groupDate >= yearAgo;
        });
        break;
    }
  }

  setFilteredGroups(filtered);
}, [groups, searchTerm, dateFilter]);

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

  const viewGroupDetails = async (groupId) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      // Get group details
      const [groupRes, membersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/group/${groupId}`),
        axios.get(`${API_BASE_URL}/api/group/${groupId}/members`)
      ]);
      
      setViewModal({
        isOpen: true,
        group: groupRes.data.data || groupRes.data,
        members: membersRes.data.data || membersRes.data || []
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch group details");
    }
  };

  const deleteGroup = (groupId, groupName) => {
    setDeleteModal({
      isOpen: true,
      groupId,
      groupName
    });
  };

  const confirmDeleteGroup = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      await axios.delete(`${API_BASE_URL}/api/group/${deleteModal.groupId}`);
      toast.success("Group deleted successfully!");
      fetchGroups();
      setDeleteModal({ isOpen: false, groupId: null, groupName: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete group");
      setDeleteModal({ isOpen: false, groupId: null, groupName: "" });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading groups...</div>;

  const pending = filteredGroups.filter((g) => g.status === "pending");
  const approved = filteredGroups.filter((g) => g.status === "approved");
  const declined = filteredGroups.filter((g) => g.status === "declined");

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-maroon mb-6 flex items-center gap-3">
            <UsersIcon className="w-10 h-10" /> Manage Study Groups
          </h1>

        {/* Search and Filter Controls */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by group name, course, location, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">
                  {dateFilter === "all" ? "All Time" :
                   dateFilter === "today" ? "Today" :
                   dateFilter === "week" ? "This Week" :
                   dateFilter === "month" ? "This Month" :
                   "This Year"}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        dateFilter === "all" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => {
                        setDateFilter("today");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        dateFilter === "today" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        setDateFilter("week");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        dateFilter === "week" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => {
                        setDateFilter("month");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        dateFilter === "month" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => {
                        setDateFilter("year");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        dateFilter === "year" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      This Year
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(searchTerm || dateFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("all");
                }}
                className="px-4 py-3 bg-red-100 text-red-600 border border-red-300 rounded-lg hover:bg-red-200 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredGroups.length} of {groups.length} groups
            {searchTerm && ` matching "${searchTerm}"`}
            {dateFilter !== "all" && ` created ${dateFilter === "today" ? "today" : `this ${dateFilter}`}`}
          </div>
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
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => viewGroupDetails(group.id)} 
                              className="bg-blue-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition text-sm"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApprove(group.id, group.group_name)} 
                              className="bg-green-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition text-sm"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDecline(group.id, group.group_name)} 
                              className="bg-red-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-red-700 transition text-sm"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteGroup(group.id, group.group_name)} 
                              className="bg-orange-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-orange-700 transition text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
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
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => viewGroupDetails(group.id)} 
                              className="bg-blue-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition text-sm"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteGroup(group.id, group.group_name)} 
                              className="bg-orange-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-orange-700 transition text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
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
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {declined.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => viewGroupDetails(group.id)} 
                              className="bg-blue-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition text-sm"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteGroup(group.id, group.group_name)} 
                              className="bg-orange-600 text-white px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-orange-700 transition text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
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

      {/* View Group Details Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Group Details</h2>
              <button
                onClick={() => setViewModal({ isOpen: false, group: null, members: [] })}
                className="text-gray-500 hover:text-gray-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
            
            {viewModal.group && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Group Name</h3>
                    <p className="text-gray-900">{viewModal.group.group_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Course</h3>
                    <p className="text-gray-900">{viewModal.group.course}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Location</h3>
                    <p className="text-gray-900">{viewModal.group.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      viewModal.group.status === 'approved' ? 'bg-green-100 text-green-800' :
                      viewModal.group.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewModal.group.status || 'pending'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Creator</h3>
                    <p className="text-gray-900">{viewModal.group.creator_name || viewModal.group.created_by}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Members</h3>
                    <p className="text-gray-900">{viewModal.group.current_members || 0} / {viewModal.group.size}</p>
                  </div>
                </div>
                
                {viewModal.group.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Description</h3>
                    <p className="text-gray-900">{viewModal.group.description}</p>
                  </div>
                )}
                
                {viewModal.group.admin_remarks && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Admin Remarks</h3>
                    <p className="text-gray-900">{viewModal.group.admin_remarks}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Group Members ({viewModal.members.length})</h3>
                  {viewModal.members.length === 0 ? (
                    <p className="text-gray-500">No members in this group</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {viewModal.members.map((member) => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.id === viewModal.group.created_by ? 'bg-purple-100 text-purple-800 font-semibold' :
                            member.status === 'approved' ? 'bg-green-100 text-green-800' :
                            member.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.id === viewModal.group.created_by ? 'Creator' : (member.status || 'pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-red-800 mb-4">Delete Group: {deleteModal.groupName}</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this group? This action cannot be undone and will remove all group data including members, messages, and schedules.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, groupId: null, groupName: "" })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGroup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
