import React, { useState, useEffect } from "react";
import { Search, Loader2, Phone, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { request } from "../../api/apiClient";
import { useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const BookingManagement = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Bộ lọc thông minh
  const [filterStatus, setFilterStatus] = useState("All"); // All, Pending, Confirmed, Arrived, Cancelled
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterStatus !== "All") queryParams.append("status", filterStatus);
      if (filterDate) queryParams.append("date", filterDate);
      if (searchTerm) queryParams.append("search", searchTerm);

      const data = await request(`/bookings_crud.php?${queryParams.toString()}`);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi", "Không thể tải danh sách đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Thêm debounce cho search nếu cần thiết, ở đây gọi trực tiếp khi dependency thay đổi
    const timer = setTimeout(() => {
      fetchBookings();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterStatus, filterDate, searchTerm]);

  // Handle Cập nhật trạng thái
  const handleUpdateStatus = async (bookingID, newStatus, actionName) => {
    const isConfirmed = await confirm({
      title: "Xác nhận",
      message: `Bạn chắc chắn muốn chuyển đơn này sang trạng thái "${actionName}"?`,
      type: newStatus === "Cancelled" ? "danger" : "info",
      confirmText: "Đồng ý",
    });

    if (!isConfirmed) return;

    try {
      const res = await request("/bookings_crud.php", {
        method: "PUT",
        body: { BookingID: bookingID, Status: newStatus },
      });

      if (res.success) {
        toast.success("Thành công", "Đã cập nhật trạng thái đơn đặt bàn.");
        fetchBookings(); // Reload data
      }
    } catch (error) {
      toast.error("Thất bại", error.message || "Không thể cập nhật.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Chờ gọi KQ</span>;
      case "Confirmed":
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Đã xác nhận</span>;
      case "Arrived":
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Đã đến</span>;
      case "Cancelled":
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Đã Hủy</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 min-h-[80vh]">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[#850A0A] uppercase mb-1">
          Quản Lý Đặt Bàn
        </h1>
        <p className="text-gray-500 text-sm">Kiểm soát đơn và liên hệ khách hàng dễ dàng</p>
      </div>

      {/* --- Bộ lọc thông minh --- */}
      <div className="bg-[#F9F9F9] p-4 rounded-2xl flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
        {/* Tabs Trạng Thái */}
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {["All", "Pending", "Confirmed", "Arrived", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === status 
                  ? "bg-[#850A0A] text-white shadow-md" 
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "All" ? "Tất cả" : 
               status === "Pending" ? "Chờ gọi" :
               status === "Confirmed" ? "Đã duyệt" :
               status === "Arrived" ? "Đã đến" : "Đã hủy"}
            </button>
          ))}
        </div>

        {/* Date & Search */}
        <div className="flex gap-3 w-full lg:w-auto overflow-x-auto">
          <div className="relative min-w-[150px]">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <CalendarIcon size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] outline-none text-sm text-gray-700"
            />
          </div>

          <div className="relative min-w-[200px] flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tên, SDT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] outline-none text-sm text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* --- Bảng dữ liệu --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100 pb-2">
              <th className="py-3 px-4 text-sm font-bold text-gray-600">Khách hàng</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-600">Thông tin Đặt</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-600">Ghi chú</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-600">Trạng thái</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-600 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t border-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-400">
                  <Loader2 size={32} className="animate-spin mx-auto text-[#EE8D2D]" />
                  <p className="mt-2 text-sm italic">Đang tải dữ liệu...</p>
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-400 text-sm italic">
                  Không tìm thấy đơn đặt bàn nào theo bộ lọc này.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.BookingID} className="hover:bg-gray-50/50 transition-colors">
                  {/* Cột 1: Thông tin khách */}
                  <td className="py-4 px-4 align-top">
                    <p className="font-bold text-gray-900">{booking.CustomerName}</p>
                    <a 
                      href={`tel:${booking.CustomerPhone}`}
                      className="inline-flex items-center gap-1.5 mt-1 text-[#EE8D2D] hover:text-[#d67d26] font-medium text-sm transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-orange-50"
                    >
                      <Phone size={14} /> {booking.CustomerPhone}
                    </a>
                  </td>

                  {/* Cột 2: Lịch */}
                  <td className="py-4 px-4 align-top">
                    <p className="font-bold text-[#850A0A]">{booking.BookingDate} <span className="opacity-50">|</span> {booking.BookingTime}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">Nhánh: {booking.BranchName}</p>
                    <p className="text-gray-600 text-sm mt-0.5 font-medium">{booking.GuestCount} Người</p>
                  </td>

                  {/* Cột 3: Note */}
                  <td className="py-4 px-4 align-top">
                    <p className="text-sm text-gray-600 line-clamp-3 w-[200px]">
                      {booking.Note || <span className="italic opacity-40">Không có ghi chú</span>}
                    </p>
                  </td>

                  {/* Cột 4: Status */}
                  <td className="py-4 px-4 align-top">
                    {getStatusBadge(booking.Status)}
                  </td>

                  {/* Cột 5: Actions */}
                  <td className="py-4 px-4 align-top text-center">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {booking.Status === "Pending" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.BookingID, "Confirmed", "Xác nhận")}
                          className="px-3 py-2 bg-[#850A0A] hover:bg-[#9F1514] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        >
                          Xác nhận Đơn
                        </button>
                      )}
                      {booking.Status === "Confirmed" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.BookingID, "Arrived", "Khách đã đến")}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        >
                          Khách Đã Đến
                        </button>
                      )}
                      {(booking.Status === "Pending" || booking.Status === "Confirmed") && (
                        <button
                          onClick={() => handleUpdateStatus(booking.BookingID, "Cancelled", "Hủy bàn")}
                          className="px-3 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-xs font-bold rounded-lg transition-all"
                        >
                          Hủy Bàn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {ConfirmDialogComponent}
    </div>
  );
};

export default BookingManagement;
