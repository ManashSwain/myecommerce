import React from "react";
import {
  Home,
  Users,
  Folder,
  Calendar,
  FileText,
  PieChart,
} from "lucide-react";

const sidebar = () => {
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
                <span className="text-sm font-medium">Team</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Folder size={18} />
                <span className="text-sm font-medium">Projects</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Calendar size={18} />
                <span className="text-sm font-medium">Calendar</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <FileText size={18} />
                <span className="text-sm font-medium">Documents</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <PieChart size={18} />
                <span className="text-sm font-medium">Reports</span>
              </div>
            </div>

            {/* Teams */}
            <div className="mt-6">
              <p className="px-4 text-xs text-gray-400 mb-2">Your teams</p>

              <div className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                  H
                </div>
                <span className="text-sm">Heroicons</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                  T
                </div>
                <span className="text-sm">Tailwind Labs</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                  W
                </div>
                <span className="text-sm">Workcation</span>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="p-4 border-t flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/40"
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">Tom Cook</span>
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

export default sidebar;
