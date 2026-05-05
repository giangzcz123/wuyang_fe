import React, { useState } from "react";
import { X, Calendar, Clock, Users, User, Phone, AlignLeft, Loader2 } from "lucide-react";
import { useToast } from "./ui/Toast";
import { request } from "../api/apiClient";

const BookingModal = ({ isOpen, onClose, branchName }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CustomerName: "",
    CustomerPhone: "",
    BookingDate: "",
    BookingTime: "",
    GuestCount: 2,
    Note: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        BranchName: branchName,
      };

      const response = await request("/bookings_crud.php", {
        method: "POST",
        body: payload,
      });

      if (response.success) {
        toast.success(
          "Đặt bàn thành công!",
          "Nhân viên sẽ sớm liên hệ để xác nhận lại với bạn."
        );
        onClose(); // Đóng modal
      } else {
        throw new Error(response.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi đặt bàn", error.message || "Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Lấy ngày hiện tại làm format YYYY-MM-DD cho input date min
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#850A0A] p-6 text-center relative shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: "url('/chinese_bg_pattern.png')", backgroundSize: "150px" }}></div>
          <h2 className="text-2xl font-bold text-[#FFF1CA] uppercase tracking-wider relative z-10">
            Đặt Bàn Gió Ngàn
          </h2>
          <p className="text-white/80 text-sm mt-1">{branchName}</p>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tên */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <User size={16} className="text-[#EE8D2D]" /> Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="CustomerName"
                  required
                  value={formData.CustomerName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Phone size={16} className="text-[#EE8D2D]" /> Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="CustomerPhone"
                  required
                  pattern="[0-9]{10,11}"
                  value={formData.CustomerPhone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Ngày đặt */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Calendar size={16} className="text-[#EE8D2D]" /> Ngày đến <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="BookingDate"
                  required
                  min={today}
                  value={formData.BookingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Giờ đặt */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Clock size={16} className="text-[#EE8D2D]" /> Thời gian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="BookingTime"
                    required
                    value={formData.BookingTime}
                    onChange={handleChange}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Users size={16} className="text-[#EE8D2D]" /> Số người <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="GuestCount"
                    required
                    min="1"
                    max="50"
                    value={formData.GuestCount}
                    onChange={handleChange}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                <AlignLeft size={16} className="text-[#EE8D2D]" /> Ghi chú (nếu có)
              </label>
              <textarea
                name="Note"
                rows="3"
                value={formData.Note}
                onChange={handleChange}
                placeholder="Yêu cầu ghế trẻ em, trang trí sinh nhật..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EE8D2D] focus:border-transparent outline-none transition-all resize-none"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            type="submit"
            form="booking-form"
            disabled={loading}
            className="w-full py-4 bg-[#850A0A] hover:bg-[#9F1514] text-[#FFF1CA] font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "XÁC NHẬN ĐẶT BÀN"
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-4">
            Bằng việc xác nhận, bạn đồng ý với các chính sách đặt bàn của WUYANG.
          </p>
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
