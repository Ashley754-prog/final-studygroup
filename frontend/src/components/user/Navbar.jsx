// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { InboxIcon, UserCircleIcon, HomeIcon, UsersIcon } from "@heroicons/react/24/solid";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUsername, logoutUser } from "../../utils/auth";
import { useNotifications } from "../../context/NotificationContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { unreadCount } = useNotifications();
  const dropdownRef = useRef(null);

  const username = getUsername() || "Guest";

  // Load profile photo from localStorage and fix localhost URLs
  useEffect(() => {
    const savedPhoto = localStorage.getItem("userProfilePhoto");
    if (savedPhoto) {
      // Convert localhost URLs to dynamic URLs
      if (savedPhoto.includes("http://localhost:5000")) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const fixedPhoto = savedPhoto.replace("http://localhost:5000", API_BASE_URL);
        setProfilePhoto(fixedPhoto);
        // Update localStorage with fixed URL
        localStorage.setItem("userProfilePhoto", fixedPhoto);
      } else {
        setProfilePhoto(savedPhoto);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const navItem = (path, label, Icon, showBadge = false) => (
    <Link
      to={path}
      className={`relative flex items-center gap-1 ${
        location.pathname === path ? "text-gold font-semibold" : "text-white hover:text-gold"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:block">{label}</span>
      {showBadge && unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2">
          {unreadCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="w-full bg-maroon text-white py-4 shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/study-squad-logo.png" alt="Logo" className="w-12 h-12 rounded-full" />
          <h1 className="text-lg font-bold">Crimsons Study Squad</h1>
        </div>

        <nav className="flex gap-6 text-sm font-medium">
          {navItem("/user-dashboard", "Home", HomeIcon)}
          {navItem("/inbox", "Inbox", InboxIcon, true)}
          {navItem("/my-study-groups", "My Study Groups", UsersIcon)}
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
            <span className="font-semibold">Hi, {username}!</span>
            {profilePhoto ? (
              <img
                src={
                  profilePhoto.startsWith("/uploads")
                    ? `http://localhost:3000${profilePhoto}`
                    : profilePhoto
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <UserCircleIcon className="w-10 h-10 text-white" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-maroon rounded-lg shadow-lg text-sm p-2 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile?tab=settings");
                }}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
              >
                Account Settings
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
