import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import customerApi from "../api/customerApi";
import { BASE_URL, request } from "../api/apiClient";

// Customer sub-components
import CartContent from "../components/customer/CartContent";
import ProductCard from "../components/customer/ProductCard";
import CategoryBar from "../components/customer/CategoryBar";
import MobileBottomBar from "../components/customer/MobileBottomBar";
import CheckoutModal from "../components/customer/CheckoutModal";
import FeedbackModal from "../components/customer/FeedbackModal";
import OrderHistory from "../components/customer/OrderHistory";
import { ToastContainer, useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmDialog";

const CustomerMenu = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [orderItems, setOrderItems] = useState([]); // Lịch sử gọi món
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const tableId = searchParams.get("table_id");
  const tableNumber = searchParams.get("table_number");
  const token = searchParams.get("token");
  const displayTable = tableNumber || tableId;

  // Load menu data
  useEffect(() => {
    if (!tableId || !token) {
      setError("Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ nhân viên.");
      setLoading(false);
      return;
    }
    localStorage.setItem("customer_session", JSON.stringify({ tableId, token, tableNumber }));

    const loadData = async () => {
      try {
        const [catRes, rawMenuData] = await Promise.all([
          request("/fetch_categories.php"),
          customerApi.getMenu(),
        ]);
        const allProducts = rawMenuData.flatMap((category) =>
          category.Products.map((product) => ({
            ...product,
            CategoryName: category.CategoryName,
          })),
        );
        setCategories([{ CategoryID: "all", CategoryName: "Tất cả" }, ...catRes]);
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Tự động cập nhật menu (bao gồm trạng thái Hết món) mỗi 30 giây
    const menuInterval = setInterval(loadData, 10000);
    return () => clearInterval(menuInterval);
  }, [tableId, token, tableNumber]);

  // Kiểm tra token định kỳ (Mỗi 10s) để khoá UI khi thu ngân thanh toán
  useEffect(() => {
    if (!tableId || !token) return;
    const interval = setInterval(async () => {
      try {
        const res = await customerApi.checkToken(tableId, token);
        if (res && res.valid === false && res.force_close === true) {
          setIsTokenValid(false);
        }
      } catch (err) {
        // Bỏ qua lỗi nếu backend chưa sẵn sàng
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [tableId, token]);

  // Poll lịch sử gọi món mỗi 15 giây (lọc theo token phiên hiện tại)
  useEffect(() => {
    if (!tableId || !token) return;
    const fetchOrders = async () => {
      try {
        const data = await customerApi.getMyOrders(tableId, token);
        if (Array.isArray(data)) setOrderItems(data);
      } catch (err) {
        // bỏ qua lỗi silent
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [tableId, token]);

  // Filter products by category and search
  useEffect(() => {
    let result = products;
    if (activeCategory !== "all") {
      const selectedCat = categories.find((c) => c.CategoryID === activeCategory);
      if (selectedCat) {
        result = result.filter((item) => item.CategoryName === selectedCat.CategoryName);
      }
    }
    if (searchTerm.trim() !== "") {
      result = result.filter((item) =>
        item.ProductName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredProducts(result);
  }, [activeCategory, searchTerm, products, categories]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.Price || 0) * item.quantity, 0),
    [cartItems],
  );

  // --- Cart handlers ---
  const handleAddToCart = (product) => {
    if (!isTokenValid) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.ProductID === product.ProductID);
      if (existing) {
        return prev.map((i) =>
          i.ProductID === product.ProductID ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ProductID: product.ProductID, ProductName: product.ProductName, Price: product.Price, quantity: 1, Note: "" }];
    });
  };

  const handleChangeNote = (productId, note) => {
    setCartItems((prev) =>
      prev.map((item) => (item.ProductID === productId ? { ...item, Note: note } : item)),
    );
  };

  const handleChangeQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.ProductID === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleClearCart = () => setCartItems([]);

  const handleSubmitOrder = async () => {
    if (!cartItems.length || !tableId) return;
    if (!isTokenValid) {
      toast.warning("Thông báo", "Bạn đã thanh toán, không thể gọi thêm món.");
      return;
    }
    try {
      setSubmittingOrder(true);
      const res = await customerApi.submitOrder({
        TableID: Number(tableId),
        Items: cartItems.map((item) => ({
          ProductID: Number(item.ProductID),
          Quantity: item.quantity,
          PriceAtTime: Number(item.Price),
          Note: item.Note || "",
        })),
      });
      if (res?.OrderID) setLastOrderId(res.OrderID);
      handleClearCart();
      setShowMobileCart(false);
      toast.success("Thành công!", "Đã gửi món xuống bếp. Bạn có thể tiếp tục gọi thêm.");
    } catch (e) {
      toast.error("Gửi món thất bại", e.message || "Vui lòng thử lại.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCallService = async (type) => {
    if (!tableId || !token) return;
    try {
      setServiceLoading(true);
      await customerApi.callService({ table_id: tableId, token, type });
      toast.info("Yêu cầu", `Đã gửi yêu cầu: ${type}`);
    } catch (e) {
      toast.error("Lỗi", e.message || "Gửi yêu cầu thất bại.");
    } finally {
      setServiceLoading(false);
    }
  };

  const loadCheckoutPreview = async () => {
    if (!tableId || !token) return;
    try {
      setCheckoutLoading(true);
      const data = await customerApi.checkoutPreview(tableId, token);
      setCheckoutPreview(data);
      setShowCheckoutModal(true);
      setShowMobileCart(false);
      request("/checkout_request.php", {
        method: "POST",
        body: { table_id: tableId, token },
      }).catch(() => { });
    } catch (e) {
      toast.error("Lỗi", e.message || "Không lấy được tạm tính.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!tableId || !token) return;
    try {
      setCheckoutLoading(true);
      // Gửi yêu cầu thanh toán thay vì tự đóng bàn
      await customerApi.callService({ table_id: tableId, type: "Yêu cầu thanh toán" });
      setShowCheckoutModal(false);
      setShowFeedback(true);
      toast.success("Đã gửi yêu cầu", "Nhân viên sẽ đến ngay!");
    } catch (e) {
      toast.error("Lỗi", e.message || "Xác nhận thanh toán thất bại.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    try {
      await customerApi.sendFeedback({
        Rating: feedback.rating,
        Comment: feedback.comment,
        OrderID: lastOrderId,
        TableID: Number(tableId),
      });
      toast.success("Cảm ơn!", "Cảm ơn bạn đã đánh giá.");
      setShowFeedback(false);
    } catch (e) {
      toast.error("Lỗi", e.message || "Gửi đánh giá thất bại.");
    }
  };

  // --- Shared cart props ---
  const cartProps = {
    cartItems,
    displayTable,
    cartTotal,
    submittingOrder,
    serviceLoading,
    checkoutLoading,
    isTokenValid,
    onSubmitOrder: handleSubmitOrder,
    onClearCart: handleClearCart,
    onChangeQuantity: handleChangeQuantity,
    onChangeNote: handleChangeNote,
    onCallService: handleCallService,
    onCheckoutPreview: loadCheckoutPreview,
  };

  // --- Render states ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7]">
        <div className="w-16 h-16 border-4 border-[#F5D7A0] border-t-[#A00000] rounded-full animate-spin"></div>
        <p className="mt-4 text-[#A00000] font-serif font-bold tracking-widest uppercase">
          Đang tải thực đơn...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8D5B5] text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">!</div>
          <p className="text-[#8B0000] font-bold text-lg mb-2 font-serif">Lỗi Truy Cập</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen font-sans pb-24 lg:pb-0">
      {ConfirmDialogComponent}
      {/* Top Banner (Mobile) */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#8B0000] to-[#C1121F] shadow-md px-4 py-3 flex justify-between items-center text-[#F5D7A0]">
        <span className="font-serif font-bold text-lg tracking-wider">Hadilao</span>
        <span className="text-sm font-bold bg-black/20 px-3 py-1 rounded-full">
          Bàn: {displayTable}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col lg:flex-row gap-8">
        {/* Menu section */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <div className="mb-6 relative group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-[#E8D5B5] rounded-2xl py-3.5 pl-12 pr-4 outline-none text-gray-700 focus:border-[#A00000] focus:ring-4 focus:ring-[#A00000]/10 transition-all shadow-sm"
              placeholder="Tìm kiếm mỹ vị..."
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#A00000]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <CategoryBar
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-2">
            {filteredProducts.map((item, id) => (
              <ProductCard
                key={id}
                item={item}
                isTokenValid={isTokenValid}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Button toggle lịch sử gọi món */}
          {orderItems.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowOrderHistory((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-[#E8D5B5] rounded-2xl shadow-sm hover:border-[#A00000] transition-all group"
              >
                <span className="text-sm font-bold text-[#8B0000] flex items-center gap-2">
                  <span className="text-base">🍽️</span>
                  Xem trạng thái món đã gọi
                  <span className="bg-[#A00000] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {orderItems.length}
                  </span>
                </span>
                <span className="text-[#A00000] text-lg transition-transform duration-300" style={{ transform: showOrderHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ⌄
                </span>
              </button>

              {showOrderHistory && (
                <div className="mt-2">
                  <OrderHistory orderItems={orderItems} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart sidebar (Desktop) */}
        <aside className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-8 h-[calc(100vh-4rem)] rounded-2xl overflow-hidden border border-[#E8D5B5] shadow-2xl z-10">
          <CartContent {...cartProps} />
        </aside>
      </div>

      {/* Bottom bar (Mobile) */}
      <MobileBottomBar
        cartItems={cartItems}
        cartTotal={cartTotal}
        isTokenValid={isTokenValid}
        onOpenCart={() => setShowMobileCart(true)}
      />

      {/* Mobile cart drawer */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex-1" onClick={() => setShowMobileCart(false)}></div>
          <div className="w-full h-[85vh] bg-white rounded-t-3xl overflow-hidden animate-slide-up shadow-2xl relative">
            <button
              onClick={() => setShowMobileCart(false)}
              className="absolute top-4 right-4 z-50 bg-black/20 text-white rounded-full p-2 backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <CartContent {...cartProps} />
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckoutModal && (
        <CheckoutModal
          checkoutPreview={checkoutPreview}
          displayTable={displayTable}
          checkoutLoading={checkoutLoading}
          onConfirm={handleConfirmCheckout}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Feedback modal */}
      {showFeedback && (
        <FeedbackModal
          feedback={feedback}
          onChangeRating={(star) => setFeedback((f) => ({ ...f, rating: star }))}
          onChangeComment={(val) => setFeedback((f) => ({ ...f, comment: val }))}
          onSubmit={handleSendFeedback}
        />
      )}

      <Footer />
    </div>
  );
};

export default CustomerMenu;
