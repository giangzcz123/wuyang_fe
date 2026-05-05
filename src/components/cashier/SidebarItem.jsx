import React from "react";
import { Link, useLocation } from "react-router-dom"; // 1. Import useLocation
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  X,
  FileText,
  CalendarDays,
} from "lucide-react";

// Tách nhỏ SidebarItem để dễ quản lý link
const SidebarItem = ({ icon, label, to, isOpen }) => {
  const location = useLocation(); // Lấy đường dẫn hiện tại
  const isActive = location.pathname === to; // Kiểm tra xem có đang ở trang này không

  return (
    <Link to={to} className="block group">
      <div
        className={`
          flex items-center gap-4 p-3 rounded-lg transition-all duration-200
          ${isActive
            ? "bg-[#FFF1CA] text-[#850A0A] shadow-md scale-[1.02]"
            : "text-[#FFF1CA] hover:bg-[#9F1514] hover:pl-5"
          }
        `}
      >
        <div className="shrink-0">{icon}</div>
        {isOpen && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
      </div>
    </Link>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Overlay cho Mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:relative z-50 h-screen transition-all duration-300 shadow-2xl flex flex-col
          ${isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: "#850A0A" }}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#9F1514]">
          <div className="flex items-center gap-3 text-[#FFF1CA]">
            {/* <UtensilsCrossed size={28} /> */}
            {isOpen && (
              <span className="font-bold text-xl tracking-[0.2em]">WuYang</span>
            )}
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-[#FFF1CA]">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {/* 2. Truyền prop 'to' thay vì 'active' */}
          <SidebarItem
            to="/cashier"
            icon={<LayoutDashboard size={22} />}
            label="Tổng quan"
            isOpen={isOpen}
          />
          <SidebarItem
            to="/cashier/tables"
            icon={<ClipboardList size={22} />}
            label="Bàn"
            isOpen={isOpen}
          />
          <SidebarItem
            to="/cashier/bookings"
            icon={<CalendarDays size={22} />}
            label="Đặt bàn"
            isOpen={isOpen}
          />
          <SidebarItem
            to="/cashier/bills"
            icon={<FileText size={22} />}
            label="Hóa đơn"
            isOpen={isOpen}
          />
          <SidebarItem
            to="/cashier/settings"
            icon={<Settings size={22} />}
            label="Cấu hình"
            isOpen={isOpen}
          />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#9F1514]">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/signin";
            }}
            className="w-full flex items-center gap-4 p-3 rounded-lg text-[#FFF1CA] hover:bg-[#9F1514] hover:pl-5 transition-all duration-200"
          >
            <div className="shrink-0"><LogOut size={22} /></div>
            {isOpen && (
              <span className="font-medium whitespace-nowrap">Đăng xuất</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
