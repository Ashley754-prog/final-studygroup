import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/solid";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPath = location.pathname;

  const menuItems = [
    { id: 1, label: "Dashboard", icon: HomeIcon, path: "/admin/dashboard" },
    { id: 2, label: "Manage Users", icon: UsersIcon, path: "/admin/manage-users" },
    { id: 3, label: "Manage Groups", icon: UserGroupIcon, path: "/admin/manage-groups" },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-maroon text-white transition-all duration-300 flex flex-col shadow-xl`}
    >
      <div className="flex items-center justify-between p-4 border-b border-maroon/30">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center flex-1" : ""}`}>
          {!isCollapsed && <span className="font-bold text-lg">Admin</span>}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded hover:bg-white/10 transition flex items-center justify-center ${
            isCollapsed ? "flex-1" : "w-10 h-10"
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all relative ${
                isActive ? "bg-gold text-maroon font-semibold shadow-md" : "hover:bg-white/10"
              }`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && isActive && (
                <div className="absolute left-20 ml-2 bg-gold text-maroon px-3 py-1.5 rounded-md text-sm font-medium shadow-lg whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
