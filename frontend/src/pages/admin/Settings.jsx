import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import AdminLayout from "../../layouts/AdminLayout";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Settings() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    language: "English",
    timezone: "Asia/Manila (GMT+8)"
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Fetch admin profile on mount
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Stored user from localStorage:", storedUser);
      console.log("User ID:", storedUser.id);
      console.log("Is admin:", storedUser.is_admin);
      
      if (!storedUser.id) {
        console.log("No user ID found in localStorage");
        return;
      }
      
      // Check if user is admin, if not redirect to login
      if (!storedUser.is_admin || storedUser.is_admin !== 1) {
        console.log("User is not admin, redirecting to login");
        toast.error("You must be an admin to access settings");
        navigate("/login");
        return;
      }
      
      console.log(`Fetching admin profile for user ID: ${storedUser.id}`);
      const response = await axios.get(`http://localhost:5000/api/admin/profile/${storedUser.id}`);
      const admin = response.data;
      console.log("Admin profile response:", admin);
      
      setFormData({
        fullName: admin.full_name || `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        language: admin.language || "English",
        timezone: admin.timezone || "Asia/Manila (GMT+8)"
      });
      
      setNotifications(admin.notifications !== false);
      setTwoFactor(admin.two_factor_auth || false);
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
      toast.error("Failed to load profile data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser.id) {
        toast.error("User ID not found");
        return;
      }
      
      const profileData = {
        full_name: formData.fullName,
        email: formData.email,
        language: formData.language,
        timezone: formData.timezone,
        notifications: notifications,
        two_factor_auth: twoFactor
      };
      
      await axios.put(`http://localhost:5000/api/admin/profile/${storedUser.id}`, profileData);
      
      // Update localStorage user data
      const updatedUser = {
        ...storedUser,
        full_name: formData.fullName,
        email: formData.email,
        language: formData.language,
        timezone: formData.timezone,
        notifications: notifications,
        two_factor_auth: twoFactor
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser.id) {
        toast.error("User ID not found");
        return;
      }
      
      const passwordData = {
        newPassword: formData.newPassword
      };
      
      await axios.put(`http://localhost:5000/api/admin/password/${storedUser.id}`, passwordData);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }));
      
      toast.success("Password changed successfully!");
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    
    try {
      // Update profile first
      await handleProfileUpdate({ preventDefault: () => {} });
      
      // If password fields are filled, update password
      if (formData.currentPassword && formData.newPassword) {
        await handlePasswordChange({ preventDefault: () => {} });
      }
      
      toast.success("All settings saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-maroon mb-5 flex items-center gap-2">
              <Cog6ToothIcon className="w-6 h-6" />
              Account Settings
            </h2>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center text-maroon text-2xl font-bold">
                  <UserCircleIcon className="w-10 h-10" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Admin User</p>
                  <p className="text-sm text-gray-600">{formData.email || "admin@wmsu.edu.ph"}</p>
                  <button className="text-sm text-maroon hover:underline mt-1">
                    Change Avatar
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-xl font-bold text-maroon mb-5 flex items-center gap-2">
              <LockClosedIcon className="w-6 h-6" />
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition pr-10"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !formData.newPassword || !formData.confirmPassword}
                className="w-full py-2.5 bg-maroon text-white rounded-lg font-medium hover:bg-maroon/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? "Changing Password..." : "Change Password"}
              </button>

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={() => setTwoFactor(!twoFactor)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-xl font-bold text-maroon mb-5 flex items-center gap-2">
              <BellIcon className="w-6 h-6" />
              Notifications
            </h2>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900">
                  Enable Notifications
                </p>
                <p className="text-sm text-gray-600">
                  Get updates about reports, users, and system alerts.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-gold after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-xl font-bold text-maroon mb-5 flex items-center gap-2">
              <GlobeAltIcon className="w-6 h-6" />
              Preferences
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select 
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition"
                >
                  <option value="English">English</option>
                  <option value="Filipino">Filipino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Zone
                </label>
                <select 
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maroon transition"
                >
                  <option value="Asia/Manila (GMT+8)">Asia/Manila (GMT+8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={handleProfileUpdate}
              disabled={profileLoading}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? "Saving Profile..." : "Save Profile"}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={loading}
              className="bg-maroon text-white px-6 py-2.5 rounded-lg font-medium hover:bg-maroon/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving All..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
