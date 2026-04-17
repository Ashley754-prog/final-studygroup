// src/components/AdminNavbar.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const handleAdminLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSettings = () => {
    navigate("/admin/settings");
    setDropdownOpen(false);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between relative">
      <h1 className="text-2xl font-bold text-maroon">Admin Dashboard</h1>

      <div className="relative flex items-center gap-4" ref={dropdownRef}>
        <div className="text-right cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <p className="text-sm font-medium text-gray-700">Admin User</p>
          <p className="text-xs text-gray-500">admin@wmsu.edu.ph</p>
        </div>

        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 bg-gold rounded-full flex items-center justify-center font-bold text-maroon cursor-pointer"
        >
          A
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <button
              onClick={handleSettings}
              className="flex items-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 transition rounded-t-xl"
            >
              <Cog6ToothIcon className="w-5 h-5" /> Settings
            </button>
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 transition rounded-b-xl"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
