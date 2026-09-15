import React from "react";
import { NavLink, Outlet } from "react-router-dom";

import {
  Home,
  Users,
  Folder,
  Calendar,
  FileText,
  PieChart,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/", icon: Home, end: true },
  { name: "Users", path: "/users", icon: Users },
  { name: "Categories", path: "/categories", icon: Folder },
  { name: "Sub categories", path: "/sub-categories", icon: Calendar },
  { name: "Products", path: "/products", icon: FileText },
  { name: "Orders", path: "/orders", icon: PieChart },
];

const Sidebar = () => {
  return (
    <div>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="p-4 text-blue-600 font-bold text-xl">~</div>

            {/* Menu */}
            <div className="space-y-1 px-2">
              {menuItems.map(({ name, path, icon: Icon, end }) => (
                <NavLink
                  key={name}
                  to={path}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${
                      isActive
                        ? "bg-gray-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
