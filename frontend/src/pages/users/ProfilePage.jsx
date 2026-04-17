import { useState, useEffect, useRef } from "react";
import { UserCircleIcon, CameraIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    username: "",
    email: "",
    bio: "",
    profile_photo: ""
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [originalUser, setOriginalUser] = useState(null); 
  const fileInputRef = useRef();

useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
      setOriginalUser(res.data);
      setPhotoPreview(res.data.profile_photo || null);
      
      // Save profile photo to localStorage for navbar
      if (res.data.profile_photo) {
        localStorage.setItem("userProfilePhoto", res.data.profile_photo);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      toast.error("Failed to fetch user data. Please try again.");
    }
  };

  fetchUser();
}, []);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // Profile photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser({ ...user, newPhotoFile: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Save profile changes
const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("first_name", user.first_name);
    formData.append("middle_name", user.middle_name);
    formData.append("last_name", user.last_name);
    formData.append("username", user.username);
    formData.append("bio", user.bio);
    if (user.newPhotoFile) formData.append("profile_photo", user.newPhotoFile);

    const token = localStorage.getItem("token");
    const res = await axios.put("http://localhost:5000/api/users/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`
      }
    });

    setUser(res.data);
    setOriginalUser(res.data);
    setPhotoPreview(res.data.profile_photo || null);
    delete user.newPhotoFile;

    // Save profile photo to localStorage for navbar
    if (res.data.profile_photo) {
      localStorage.setItem("userProfilePhoto", res.data.profile_photo);
    }

    // show toast
    toast.success("Profile updated successfully!");

    // change button temporarily
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);

  } catch (err) {
    console.error(err);
    toast.error("Failed to update profile.");
  }
};


  // Cancel changes
  const handleCancel = () => {
    if (originalUser) {
      setUser(originalUser);
      setPhotoPreview(originalUser.profile_photo || null);
      delete user.newPhotoFile;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] w-[1200px] max-w-[90rem] mx-auto">
      <div className="flex-1 bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <div className="p-8 lg:p-10">
            <div className="max-w-5xl mx-auto">

              {/* Tabs */}
              <div className="flex border-b border-gray-300 mb-8">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-8 py-4 font-semibold text-lg transition-colors ${
                    activeTab === "profile"
                      ? "text-maroon border-b-4 border-gold"
                      : "text-gray-500 hover:text-maroon"
                  }`}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-8 py-4 font-semibold text-lg transition-colors ${
                    activeTab === "settings"
                      ? "text-maroon border-b-4 border-gold"
                      : "text-gray-500 hover:text-maroon"
                  }`}
                >
                  Account Settings
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-7">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      {photoPreview ? (
                        <img
                          src={
                            photoPreview.startsWith("/uploads")
                              ? `http://localhost:3000${photoPreview}`
                              : photoPreview
                          }
                          alt="Profile"
                          className="w-28 h-28 rounded-full border-4 border-maroon shadow-lg object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-28 h-28 text-maroon border-4 border-maroon rounded-full p-2 bg-white shadow-lg" />
                      )}
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="absolute bottom-0 right-0 bg-gold text-maroon p-2 rounded-full shadow-md hover:brightness-110 transition"
                      >
                        <CameraIcon className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-bold text-maroon">{`${user.first_name} ${user.middle_name} ${user.last_name}`}</h3>
                      <p className="text-sm text-gray-600">{user.username}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={user.first_name}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        value={user.middle_name}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={user.last_name}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={user.username}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
                    <textarea
                      name="bio"
                      value={user.bio || ""}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-gold transition"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-gold text-maroon py-3.5 font-semibold rounded-lg hover:brightness-110 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-7">
                    <h3 className="text-2xl text-amber-800">
                      Your Account Details
                    </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full p-3 rounded-lg bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
