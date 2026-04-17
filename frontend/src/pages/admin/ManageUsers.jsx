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
  LinkIcon
} from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    username: ""
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/user/admin-list");
      setUsers(res.data || []);
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

  // Delete user
  const deleteUser = async (userId, username) => {
    setConfirmModal({
      isOpen: true,
      userId,
      username
    });
  };

  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/user/delete/${confirmModal.userId}`);
      toast.success("User deleted successfully!");
      fetchUsers();
      setConfirmModal({ isOpen: false, userId: null, username: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
      setConfirmModal({ isOpen: false, userId: null, username: "" });
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

        <div className="grid gap-5">
          {users.length === 0 ? (
            <p className="text-gray-500 bg-white p-8 rounded-xl text-center shadow">
              No users found
            </p>
          ) : (
            users.map((user) => {
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
                      {user.username?.[0]?.toUpperCase() || user.first_name?.[0] || "U"}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {user.username || `${user.first_name} ${user.last_name}`}
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative opacity-95">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
              onClick={() => setSelectedUser(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4">{selectedUser.username}</h2>
            
            <p><strong>Full Name:</strong> {selectedUser.first_name} {selectedUser.middle_name} {selectedUser.last_name}</p>
            <p className="flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5" /> {selectedUser.email}
            </p>
            <p className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" /> Created At: {new Date(selectedUser.created_at).toLocaleString()}
            </p>
            <p className="flex items-center gap-2">
              {selectedUser.is_verified ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <XCircleIcon className="w-5 h-5 text-red-600" />} 
              Verified: {selectedUser.is_verified ? "Yes" : "No"}
            </p>
            {selectedUser.google_id && (
              <p className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Linked Google Account
              </p>
            )}
            <p><strong>Status:</strong> {selectedUser.status}</p>
            {selectedUser.bio && <p><strong>Bio:</strong> {selectedUser.bio}</p>}
            {selectedUser.profile_photo && (
              <img src={selectedUser.profile_photo} className="mt-3 w-32 h-32 rounded-full" />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: null, username: "" })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete the user "${confirmModal.username}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
