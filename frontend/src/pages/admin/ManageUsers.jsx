// src/pages/admin/ManageUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  EnvelopeIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon
} from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import { useRealtime } from "../../context/RealtimeContext";

export default function ManageUsers() {
  // Edit User Form Component
  const EditUserForm = ({ user, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || ''
    });

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        await axios.put(`${API_BASE_URL}/api/users/update/${user.id}`, formData);
        onSuccess();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update user");
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Update User
          </button>
        </div>
      </form>
    );
  };
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    username: "",
    deleteData: false // false = account only, true = everything
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: null
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Helper function to format full name
  const formatFullName = (user) => {
    const parts = [];
    if (user.first_name) parts.push(user.first_name);
    if (user.middle_name) parts.push(user.middle_name);
    if (user.last_name) parts.push(user.last_name);
    return parts.length > 0 ? parts.join(' ') : user.username || 'Unknown User';
  };

  // Helper function to get initials
  const getInitials = (user) => {
    const fullName = formatFullName(user);
    return fullName.charAt(0).toUpperCase() || 'U';
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.get(`${API_BASE_URL}/api/user/admin-list`);
      // Filter out admin accounts for security - admins shouldn't manage other admins
      const nonAdminUsers = (res.data || []).filter(user => !user.is_admin);
      setUsers(nonAdminUsers);
      setFilteredUsers(nonAdminUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.username?.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate >= monthAgo;
          });
          break;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate >= yearAgo;
          });
          break;
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, dateFilter]);

  // Real-time updates using RealtimeContext
  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket) return;

    // USER UPDATES
    socket.on("user_created", (newUser) => {
      toast.success(`New user created: ${newUser.username}`);
      fetchUsers();
    });

    socket.on("user_updated", (data) => {
      toast.info(`User "${data.username}" updated`);
      fetchUsers();
    });

    socket.on("user_deleted", (data) => {
      toast.info(`User "${data.username}" deleted`);
      fetchUsers();
    });

    return () => {
      if (socket) {
        socket.off("user_created");
        socket.off("user_updated");
        socket.off("user_deleted");
      }
    };
  }, [socket]);

  // Delete user
  const deleteUser = async (userId, username) => {
    setConfirmModal({
      isOpen: true,
      userId,
      username
    });
  };

  // Restore user
  const restoreUser = async (userId, username) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      await axios.put(`${API_BASE_URL}/api/user/restore/${userId}`);
      toast.success(`User "${username}" restored successfully!`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to restore user:", err);
      toast.error("Failed to restore user");
    }
  };

  const confirmDeleteUser = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const deleteUrl = `${API_BASE_URL}/api/user/delete/${confirmModal.userId}?deleteData=${confirmModal.deleteData ? 'true' : 'false'}`;
      await axios.delete(deleteUrl);
      
      const message = confirmModal.deleteData 
        ? "User and all their data deleted successfully!"
        : "User account deleted, groups and data preserved!";
      
      toast.success(message);
      fetchUsers();
      setConfirmModal({ isOpen: false, userId: null, username: "", deleteData: false });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
      setConfirmModal({ isOpen: false, userId: null, username: "", deleteData: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-maroon mb-8 flex items-center gap-3">
          <UserIcon className="w-10 h-10" />
          Manage Users
        </h1>

        {/* Search and Filter Controls */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, name, or email..."
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
            Showing {filteredUsers.length} of {users.length} users
            {searchTerm && ` matching "${searchTerm}"`}
            {dateFilter !== "all" && ` from ${dateFilter === "today" ? "today" : `this ${dateFilter}`}`}
          </div>
        </div>

        <div className="grid gap-8">
          {/* Active Users Section */}
          <div>
            <h2 className="text-2xl font-bold text-maroon mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              Active Users ({filteredUsers.filter(u => u.status === 'active').length})
            </h2>
            <div className="grid gap-5">
              {filteredUsers.filter(u => u.status === 'active').length === 0 ? (
                <p className="text-gray-500 bg-white p-8 rounded-xl text-center shadow">
                  No active users found
                </p>
              ) : (
                filteredUsers.filter(u => u.status === 'active').map((user) => {
                  const isInactive = user.status !== "active";
                  return (
                    <div
                      key={user.id}
                      className={`bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition`}
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                            isInactive ? "bg-gray-400" : "bg-gray-200"
                          }`}
                        >
                          {getInitials(user)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {formatFullName(user)}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5" /> {user.email}
                          </p>
                          {isInactive && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">Inactive</p>
                          )}
                        </div>
                      </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <UserIcon className="w-5 h-5" />
                      View Details
                    </button>

                    {/* Edit User */}
                    <button
                      onClick={() => setEditModal({ isOpen: true, user: user })}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                      <PencilIcon className="w-5 h-5" />
                      Edit
                    </button>

                    {/* Delete button always enabled for admin */}
                    <button
                      onClick={() => deleteUser(user.id, user.username)}
                      className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Archived Users Section */}
      <div>
        <h2 className="text-2xl font-bold text-maroon mb-4 flex items-center gap-2">
          <XCircleIcon className="w-6 h-6 text-red-600" />
          Archived Users ({filteredUsers.filter(u => u.status === 'banned').length})
        </h2>
        <div className="grid gap-5">
          {filteredUsers.filter(u => u.status === 'banned').length === 0 ? (
            <p className="text-gray-500 bg-white p-8 rounded-xl text-center shadow">
              No archived users found
            </p>
          ) : (
            filteredUsers.filter(u => u.status === 'banned').map((user) => (
              <div
                key={user.id}
                className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition opacity-75"
              >
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gray-400">
                    {getInitials(user)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {formatFullName(user)}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5" /> {user.email}
                    </p>
                    <p className="text-xs text-red-600 mt-1 font-semibold">Banned/Archived</p>
                  </div>
                </div>

                {/* Action Buttons - View Details and Restore for archived users */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                  >
                    <UserIcon className="w-5 h-5" />
                    View Details
                  </button>
                  <button
                    onClick={() => restoreUser(user.id, user.username)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative opacity-95">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {selectedUser.username || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Unknown User'}
            </h2>
            
            <div className="space-y-3">
              <div>
                <strong>Full Name:</strong> 
                <p className="text-gray-700">
                  {selectedUser.first_name || ''} {selectedUser.middle_name || ''} {selectedUser.last_name || ''}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-gray-500" /> 
                <span>{selectedUser.email || 'No email'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" /> 
                <span>
                  Created At: {selectedUser.created_at ? 
                    new Date(selectedUser.created_at).toLocaleString() : 
                    'Unknown'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedUser.is_verified ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-600" /> 
                    <span className="text-green-600 font-semibold">Verified: Yes</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5 text-red-600" /> 
                    <span className="text-red-600 font-semibold">Verified: No</span>
                  </>
                )}
              </div>
                            
              {selectedUser.google_id && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" /> 
                  <span className="text-blue-600">Linked Google Account</span>
                </div>
              )}
              
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                  selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedUser.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUser.status || 'Unknown'}
                </span>
              </div>
              
              {selectedUser.bio && (
                <div>
                  <strong>Bio:</strong>
                  <p className="text-gray-700 mt-1">{selectedUser.bio}</p>
                </div>
              )}
              
              {selectedUser.profile_photo && (
                <div>
                  <strong>Profile Photo:</strong>
                  <img 
                    src={selectedUser.profile_photo} 
                    alt="Profile" 
                    className="mt-2 w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                User ID: {selectedUser.id || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit User: {editModal.user?.username}</h2>
            
            <EditUserForm 
              user={editModal.user} 
              onSuccess={() => {
                fetchUsers();
                setEditModal({ isOpen: false, user: null });
                toast.success("User updated successfully!");
              }}
              onCancel={() => setEditModal({ isOpen: false, user: null })}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-red-800 mb-4">Delete User: {confirmModal.username}</h2>
            <p className="text-gray-600 mb-6">Choose how you want to delete this user:</p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={!confirmModal.deleteData}
                  onChange={() => setConfirmModal(prev => ({ ...prev, deleteData: false }))} 
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Delete Account Only</div>
                  <div className="text-sm text-gray-600">
                    User account removed, but their groups and data are preserved and reassigned to other members.
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={confirmModal.deleteData}
                  onChange={() => setConfirmModal(prev => ({ ...prev, deleteData: true }))} 
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold text-red-600">Delete Everything</div>
                  <div className="text-sm text-gray-600">
                    User account AND all their groups, messages, and data will be permanently deleted.
                  </div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, userId: null, username: "", deleteData: false })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  confirmModal.deleteData 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {confirmModal.deleteData ? "Delete Everything" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
