import React, { useState } from "react";
import BookingItem from "../components/BookingItem";
import Header from "../components/Header";
import BookingModal from "../components/BookingModal";

const STORES_DATA = [
  {
    id: 1,
    name: "WuYang Aeon Mall Long Biên",
    address:
      "Lô số T147-1 Sảnh Vườn TTTM Aeon Mall Long Biên, Số 27 Đường Cổ Linh, Phường Long Biên, Thành Phố Hà Nội, Việt Nam",
    openTime: "09:00 - 22:00",
    phone: "02473006766",
  },
  {
    id: 2,
    name: "WuYang Center Point Lê Văn Lương",
    address:
      "Tầng 4, Trung tâm thương mại Hà Nội Centerpoint, Số 27 Đường Lê Văn Lương, Phường Thanh Xuân, Thành Phố Hà Nội, Việt Nam",
    openTime: "09:00 - 22:00",
    phone: "02473007975",
  },
  {
    id: 3,
    name: "WuYang Giảng Võ",
    address:
      "Gian hàng 01-02, Tầng 2 Tòa nhà Grandeur Palace Giảng Võ, Số 138B Phố Giảng Võ, Phường Giảng Võ, Thành phố Hà Nội, Việt Nam",
    openTime: "09:00 - 22:00",
    phone: "02473008888",
  },
];

const BookingPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  const filteredStores = STORES_DATA.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleBookClick = (branchName) => {
    setSelectedBranch(branchName);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen mt-35">
      <Header />

      {/* Sửa w-[40%] thành hệ thống linh hoạt:
         - Mobile: w-full (chiếm hết)
         - Tablet: w-[80%] (vừa phải)
         - Desktop: max-w-4xl (không quá rộng gây mỏi mắt)
      */}
      <div className="mx-auto w-full md:w-[90%] lg:max-w-5xl bg-white shadow-xl mt-24 md:mt-32 p-4 md:p-8 rounded-t-3xl md:rounded-3xl min-h-[80vh]">
        {/* Tiêu đề bổ sung cho chuyên nghiệp */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-[#850A0A] font-['Unbounded'] uppercase tracking-tight">
            Hệ thống nhà hàng
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Chọn chi nhánh gần bạn nhất để đặt bàn
          </p>
        </div>

        {/* Thanh Search */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Nhập tên nhà hàng, khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3.5 pl-12 pr-4 bg-[#F8F8F8] border-none rounded-xl focus:ring-2 focus:ring-orange-400 text-gray-700 shadow-inner outline-none transition-all"
          />
        </div>

        {/* Danh sách các chi nhánh */}
        <div className="space-y-2">
          {filteredStores.length > 0 ? (
            filteredStores.map((store) => (
              <BookingItem
                key={store.id}
                name={store.name}
                address={store.address}
                openTime={store.openTime}
                phone={store.phone}
                onBookClick={handleBookClick}
              />
            ))
          ) : (
            <div className="text-center py-20">
              <span className="text-5xl block mb-4 opacity-50">🏮</span>
              <p className="text-gray-400 italic">
                Không tìm thấy nhà hàng phù hợp...
              </p>
            </div>
          )}
        </div>
      </div>

      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        branchName={selectedBranch} 
      />
    </div>
  );
};

export default BookingPage;
