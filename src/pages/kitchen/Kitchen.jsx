import React, { useEffect, useState, useCallback } from "react";
import kitchenApi from "../../api/kitchenApi";
import customerApi from "../../api/customerApi";
import { formatPrice } from "../../utils/format";
import { ToastContainer, useToast } from "../../components/ui/Toast";

// --- Status config ---
const STATUS_FLOW = {
  Waiting: { label: "Chờ nấu", next: "Cooking", nextLabel: "Bắt đầu nấu →", color: "border-yellow-500/50 bg-yellow-500/10", badge: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30" },
  Cooking: { label: "Đang nấu", next: "Served", nextLabel: "Hoàn thành ✓", color: "border-orange-500/50 bg-orange-500/10", badge: "bg-orange-500/20 text-orange-200 border-orange-500/30" },
  Served: { label: "Đã phục vụ", next: null, nextLabel: null, color: "border-green-500/50 bg-green-500/10", badge: "bg-green-500/20 text-green-200 border-green-500/30" },
};

// --- Group by TableID ---
const groupByTable = (items) => {
  const map = {};
  items.forEach((item) => {
    const key = item.TableID ?? item.TableNumber ?? "?";
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b));
};

// --- Single order item card ---
const OrderCard = ({ item, onUpdateStatus, updating }) => {
  const sc = STATUS_FLOW[item.ItemStatus] || STATUS_FLOW["Waiting"];
  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 shadow-lg ${sc.color} backdrop-blur-md`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#F5D7A0] text-base leading-tight line-clamp-2">
            {item.ProductName}
          </p>
          {item.Note ? (
            <p className="text-xs text-red-600 font-medium mt-1 italic">
              📝 {item.Note}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-2xl font-black text-gray-700">×{item.Quantity}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sc.badge}`}>
          {sc.label}
        </span>
        {sc.next && (
          <button
            onClick={() => onUpdateStatus(item.OrderItemID, sc.next)}
            disabled={updating === item.OrderItemID}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm ${sc.next === "Cooking"
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
              } ${updating === item.OrderItemID ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {updating === item.OrderItemID ? "..." : sc.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Table section ---
const TableSection = ({ tableKey, items, onUpdateStatus, updating }) => {
  const waitingCount = items.filter((i) => i.ItemStatus === "Waiting").length;
  const cookingCount = items.filter((i) => i.ItemStatus === "Cooking").length;

  return (
    <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10">
      {/* Table header */}
      <div className="bg-gradient-to-r from-[#8B0000] to-[#C1121F] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#F5D7A0] font-serif text-2xl font-black">
            桌 {tableKey}
          </span>
          <span className="text-[#F5D7A0]/80 text-sm font-medium">
            Bàn {tableKey}
          </span>
        </div>
        <div className="flex gap-2">
          {waitingCount > 0 && (
            <span className="bg-yellow-400 text-yellow-900 text-[11px] font-black px-2 py-0.5 rounded-full">
              {waitingCount} chờ
            </span>
          )}
          {cookingCount > 0 && (
            <span className="bg-orange-400 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
              {cookingCount} nấu
            </span>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => (
          <OrderCard
            key={item.OrderItemID}
            item={item}
            onUpdateStatus={onUpdateStatus}
            updating={updating}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Kitchen page ---
const Kitchen = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const updating = updatingId; // Alias for JSX compatibility
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "menu"
  const [menuData, setMenuData] = useState([]); // List categories with products
  const [menuLoading, setMenuLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await kitchenApi.getOrders();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error("Kitchen: lỗi lấy đơn", err);
      toast.error("Lỗi tải đơn", err.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load ngay và poll mỗi 2s cho Đơn Bếp
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 2000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, activeTab]);

  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      const data = await kitchenApi.getProducts();
      if (Array.isArray(data)) setMenuData(data);
    } catch (err) {
      console.error("Kitchen: lỗi lấy menu", err);
      toast.error("Lỗi tải menu", err.message || "Không thể tải danh sách thực đơn.");
    } finally {
      setMenuLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "menu") {
      fetchMenu();
    }
  }, [fetchMenu, activeTab]);

  const handleToggleProduct = async (productId, currentAvailable) => {
    const nextAvailable = currentAvailable === 1 ? 0 : 1;
    setUpdatingId(productId);
    try {
      await kitchenApi.toggleProduct(productId, nextAvailable);
      // Update local state
      setMenuData((prev) =>
        prev.map((cat) => ({
          ...cat,
          Products: cat.Products.map((p) =>
            p.ProductID === productId ? { ...p, IsAvailable: nextAvailable } : p
          ),
        }))
      );
      toast.success("Cập nhật thành công", "Trạng thái món đã được thay đổi.");
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      toast.error("Lỗi cập nhật", err.message || "Cần kiểm tra lại kết nối.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    setUpdatingId(itemId);
    try {
      await kitchenApi.updateItemStatus(itemId, newStatus);
      // Cập nhật state local tức thì
      setItems((prev) =>
        prev.map((item) =>
          item.OrderItemID === itemId
            ? { ...item, ItemStatus: newStatus }
            : item,
        ).filter((item) => item.ItemStatus !== "Served"), // Ẩn món đã phục vụ
      );
      toast.success("Cập nhật thành công", "Trạng thái đơn hàng đã được thay đổi.");
    } catch (err) {
      console.error("Lỗi gọi service:", err);
      toast.error("Lỗi thao tác", "Không thể cập nhật trạng thái yêu cầu.");
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = groupByTable(items);

  return (
    <div 
      className="min-h-screen bg-[#1a0a0a] p-4 sm:p-6 lg:p-8 font-sans relative"
      style={{
        backgroundImage: "url('/kitchen_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a0a0a] via-[#5c0a0a] to-[#1a0a0a] border-b border-red-900/40 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="text-[#F5D7A0] font-serif">
            <p className="text-3xl font-black tracking-widest leading-none">廚房</p>
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-70 mt-0.5">Bếp Chính</p>
          </div>
          <div className="h-10 w-px bg-red-700/40" />
          <div>
            <p className="text-white font-bold text-lg">Màn hình bếp</p>
            <p className="text-red-300 text-xs">Tự động làm mới mỗi 10 giây</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#F5D7A0]/5 p-1 rounded-2xl mr-4 border border-[#F5D7A0]/10">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-[#A00000] text-[#F5D7A0] shadow-lg"
                  : "text-[#F5D7A0]/60 hover:bg-[#F5D7A0]/10"
              }`}
            >
              📋 Đơn Bếp
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "menu"
                  ? "bg-[#A00000] text-[#F5D7A0] shadow-lg"
                  : "text-[#F5D7A0]/60 hover:bg-[#F5D7A0]/10"
              }`}
            >
              📖 Thực đơn
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/signin";
            }}
            className="bg-red-600/20 hover:bg-red-600/40 text-red-200 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-red-600/30 flex items-center gap-2"
          >
            退出 Đăng xuất
          </button>
          {activeTab === "orders" && (
            <div className="flex items-center gap-2">
              {items.length > 0 ? (
                <span className="bg-red-700/50 text-red-100 text-[10px] font-black px-2.5 py-1 rounded-full border border-red-500/30 animate-pulse uppercase tracking-wider">
                  {items.length} món chờ
                </span>
              ) : (
                <span className="bg-green-700/50 text-green-100 text-[10px] font-black px-2.5 py-1 rounded-full border border-green-500/30 uppercase tracking-wider">
                  ✓ Trống
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => {
              if (activeTab === "orders") { setLoading(true); fetchOrders(); }
              else fetchMenu();
            }}
            className="bg-[#F5D7A0]/10 hover:bg-[#F5D7A0]/20 text-[#F5D7A0] px-4 py-2 rounded-xl text-sm font-bold transition-all border border-[#F5D7A0]/20"
          >
            ↻ Làm mới
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {activeTab === "orders" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="w-16 h-16 border-4 border-[#F5D7A0]/20 border-t-[#F5D7A0] rounded-full animate-spin mb-4" />
              <p className="text-[#F5D7A0]/60 font-serif">Đang tải đơn bếp...</p>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <p className="text-8xl mb-4">🍜</p>
              <p className="text-[#F5D7A0] font-serif text-2xl font-bold">厨房安静</p>
              <p className="text-[#F5D7A0]/60 mt-2">Bếp đang yên tĩnh. Chưa có món nào cần xử lý!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([tableKey, items]) => (
                <TableSection
                  key={tableKey}
                  tableKey={tableKey}
                  items={items}
                  onUpdateStatus={handleUpdateStatus}
                  updating={updating}
                />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-10">
            {menuLoading ? (
               <div className="flex flex-col items-center justify-center h-80">
                  <div className="w-16 h-16 border-4 border-[#F5D7A0]/20 border-t-[#F5D7A0] rounded-full animate-spin mb-4" />
                  <p className="text-[#F5D7A0]/60 font-serif">Đang tải thực đơn...</p>
               </div>
            ) : menuData.map((category) => (
              <div key={category.CategoryID} className="bg-white/5 rounded-3xl p-6 border border-white/5 hover:border-[#F5D7A0]/20 transition-all">
                <h2 className="text-[#F5D7A0] text-2xl font-serif font-black mb-6 border-b border-[#F5D7A0]/20 pb-2">
                  {category.CategoryName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-[#F5D7A0]">
                  {category.Products.map((product) => (
                    <div key={product.ProductID} className={`p-4 rounded-2xl border transition-all shadow-lg ${
                      product.IsAvailable == 0 
                        ? "bg-black/80 border-gray-800 opacity-80 grayscale backdrop-blur-md" 
                        : "bg-black/60 border-white/10 hover:bg-black/80 hover:border-[#F5D7A0]/30 backdrop-blur-md"
                    }`}>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm line-clamp-2">{product.ProductName}</p>
                          <p className="text-xs opacity-60 mt-1">{formatPrice(product.Price)}</p>
                        </div>
                        <img src={product.ImageURL} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.IsAvailable == 0 ? "bg-red-900/40 text-red-400 border border-red-900/60" : "bg-green-900/40 text-green-400 border border-green-900/60"
                        }`}>
                          {product.IsAvailable == 0 ? "Hết món" : "Còn món"}
                        </span>
                        <button
                          onClick={() => handleToggleProduct(product.ProductID, Number(product.IsAvailable))}
                          disabled={updating === product.ProductID}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                            product.IsAvailable == 0
                              ? "bg-green-600 hover:bg-green-500 text-white"
                              : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                          } ${updating === product.ProductID ? "opacity-50" : ""}`}
                        >
                          {updating === product.ProductID ? "..." : product.IsAvailable == 0 ? "Bật món" : "🛑 Hết món"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Kitchen;
