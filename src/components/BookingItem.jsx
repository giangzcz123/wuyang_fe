import React from "react";

const BookingItem = ({ name, address, openTime, phone, onBookClick }) => {
  return (
    <div className="py-6 border-b border-gray-100 last:border-none flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      {/* 1. Phần thông tin: Chiếm hết chiều rộng trên Mobile, tự dãn trên Desktop */}
      <div className="flex-1">
        {/* Tên chi nhánh */}
        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2 text-xl md:text-2xl text-[#EE8D2D]">•</span>
          {name}
        </h3>

        {/* Địa chỉ và thời gian */}
        <div className="mt-2 text-gray-500 text-sm md:text-[15px] leading-relaxed">
          <p className="max-w-2xl">{address}</p>
          <p className="mt-1 font-medium text-gray-400">
            Giờ hoạt động: <span className="text-gray-600">{openTime}</span>
          </p>
        </div>
      </div>

      {/* 2. Cụm nút thao tác: Xếp chồng trên Mobile, hàng ngang trên Desktop */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[320px] lg:min-w-[380px]">
        {/* Nút Gọi điện */}
        <a
          href={`tel:${phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 border border-[#EE8D2D] rounded-lg text-[#850A0A] font-bold hover:bg-orange-50 transition-all active:scale-95"
        >
          <span className="text-lg">📞</span>
          <span className="underline decoration-1 underline-offset-4">
            {phone}
          </span>
        </a>

        {/* Nút Đặt bàn */}
        <button 
          onClick={() => onBookClick(name)}
          className="flex-1 w-full h-full py-3 md:py-2.5 bg-[#EE8D2D] text-white font-bold rounded-lg shadow-md hover:bg-[#d67d26] transition-all active:scale-95 cursor-pointer"
        >
          Đặt bàn
        </button>
      </div>
    </div>
  );
};

export default BookingItem;
