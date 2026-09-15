import React from "react";

import {
  Home,
  Users,
  Folder,
  Calendar,
  FileText,
  PieChart,
} from "lucide-react";

const Sidebar = () => {
  return (
    <div>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="p-4 text-blue-600 font-bold text-xl">~</div>

            {/* Menu */}
            <div className="space-y-1 px-2">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100 text-blue-600 cursor-pointer">
                <Home size={18} />
                <span className="text-sm font-medium">Dashboard</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Users size={18} />
                <span className="text-sm font-medium">Users</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Folder size={18} />
                <span className="text-sm font-medium">Categories</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Calendar size={18} />
                <span className="text-sm font-medium">Sub categories</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <FileText size={18} />
                <span className="text-sm font-medium">Products</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <PieChart size={18} />
                <span className="text-sm font-medium">Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
