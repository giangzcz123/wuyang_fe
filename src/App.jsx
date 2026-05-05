import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";

// 1. Import trang Home bạn vừa tạo (Lưu ý: Không phải icon Home từ Lucide)
import { Home } from "./pages/Home";
import Menu from "./pages/Menu";
import BookingPage from "./pages/BookingPage";
import SignInPage from "./pages/SignInPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import TableManagement from "./pages/cashier/TableManagement";
import Dashboard from "./pages/cashier/Dashboard";
import HomeCashier from "./pages/cashier/HomeCashier";
import BillManagement from "./pages/cashier/BillManagement";
import BookingManagement from "./pages/cashier/BookingManagement";
import CustomerMenu from "./pages/CustomerMenu";
import Kitchen from "./pages/kitchen/Kitchen";
import News from "./pages/News";
import About from "./pages/About";

// Admin Imports
import Admin from "./pages/admin/Admin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminBills from "./pages/admin/AdminBills";
import AdminFeedbacks from "./pages/admin/AdminFeedbacks";
import AdminTables from "./pages/admin/AdminTables";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Điều hướng mặc định: Nếu vào "/" sẽ tự chuyển sang "/home" */}
          {/* 2. Khai báo Route cho trang chủ - Sử dụng thẻ Route chuẩn */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/customer-menu" element={<CustomerMenu />} />
          <Route path="/news" element={<News />} />
          <Route path="/about" element={<About />} />


          <Route element={<ProtectedRoute allowedRoles={["Cashier"]} />}>
            <Route path="/cashier" element={<Dashboard />}>
              <Route index element={<HomeCashier />} />
              <Route path="tables" element={<TableManagement />} />
              <Route path="bills" element={<BillManagement />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="staff" element={<div>Trang nhân viên</div>} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Kitchen"]} />}>
            <Route path="/kitchen" element={<Kitchen />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<Admin />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bills" element={<AdminBills />} />
              <Route path="feedbacks" element={<AdminFeedbacks />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="tables" element={<AdminTables />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F9F6F2]">
                <h1 className="text-8xl font-serif font-bold text-red-800/20">
                  404
                </h1>
                <div className="mt-[-2rem]">
                  <p className="text-gray-600 font-serif italic text-lg">
                    "Mỹ vị khó tìm, trang này còn khó tìm hơn..."
                  </p>
                  <p className="text-gray-400 mt-2 text-sm">
                    Ối! Trang bạn đang truy cập không tồn tại.
                  </p>
                  <a
                    href="/"
                    className="inline-block mt-8 px-8 py-3 bg-red-800 text-white font-bold rounded-sm shadow-lg hover:bg-red-900 transition-all"
                  >
                    QUAY LẠI TRANG CHỦ
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
