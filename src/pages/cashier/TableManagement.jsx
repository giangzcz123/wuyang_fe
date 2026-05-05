import React, { useState, useEffect } from "react";
import { formatPrice } from "../../utils/format";
import {
  Coffee,
  UserCheck,
  Eraser,
  PlayCircle,
  Edit3,
  Loader2,
} from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { request } from "../../api/apiClient";

const TableManagement = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingTableId, setProcessingTableId] = useState(null);
  const [qrModal, setQrModal] = useState({
    open: false,
    tableLabel: null,
    orderId: null,
    orderLink: "",
  });

  // 1. Lấy sơ đồ bàn từ API khi component mount
  const fetchTables = async () => {
    try {
      const data = await request("/tables_map.php");
      setTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu bàn:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // 10 giây/lần
    return () => clearInterval(interval);
  }, []);

  // 2. Hàm xử lý Mở bàn gọi API POST
  const handleOpenTable = async (tableId, tableLabel) => {
    try {
      setProcessingTableId(tableId);
      const data = await request(`/tables_open.php?id=${tableId}`, {
        method: "POST",
      });
      if (data.success) {
        setQrModal({
          open: true,
          tableLabel: tableLabel,
          orderId: data.OrderID,
          orderLink: data.OrderLink,
        });
        toast.success("Bàn đã mở", `Bàn ${tableLabel} đã sẵn sàng đón khách.`);
        fetchTables();
      } else {
        console.error("Lỗi mở bàn:", data.error);
        toast.error("Lỗi mở bàn", data.error || "Không rõ nguyên nhân.");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      toast.error("Lỗi kết nối", "Vui lòng kiểm tra lại server.");
    } finally {
      setProcessingTableId(null);
    }
  };

  // 3. Hàm xử lý Thanh toán
  const handleCheckoutTable = async (tableId, tableLabel) => {
    const ok = await confirm({
      title: "Xác nhận thanh toán?",
      message: `Bạn có chắc chắn muốn xác nhận thanh toán cho Bàn ${tableLabel}?`,
      type: "info",
      confirmText: "Xác nhận"
    });
    if (!ok) return;

    try {
      setProcessingTableId(tableId);
      const data = await request(`/tables_checkout.php?id=${tableId}`);
      if (data.success) {
        toast.success("Thành công", `Bàn ${tableLabel} đã thanh toán xong.`);
        fetchTables();
      } else {
        toast.error("Lỗi thanh toán", data.error || "Không xác định");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      toast.error("Lỗi kết nối", "Vui lòng thử lại.");
    } finally {
      setProcessingTableId(null);
    }
  };

  // 4. Hàm xử lý Xác nhận sạch
  const handleCleanDone = async (tableId, tableLabel) => {
    try {
      setProcessingTableId(tableId);
      const data = await request(`/tables_update_status.php?id=${tableId}&status=0`);
      if (data.success) {
        toast.info("Đã dọn xong", `Bàn ${tableLabel} hiện đã trống.`);
        fetchTables();
      } else {
        toast.error("Lỗi cập nhật", data.error || "Không xác định");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      toast.error("Lỗi kết nối", "Vui lòng thử lại.");
    } finally {
      setProcessingTableId(null);
    }
  };

  const onAction = (tableId, nextStatus, tableLabel) => {
    if (nextStatus === 1) handleOpenTable(tableId, tableLabel);
    else if (nextStatus === 3) handleCheckoutTable(tableId, tableLabel);
    else if (nextStatus === 0) handleCleanDone(tableId, tableLabel);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#850A0A]">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="italic">Đang tải sơ đồ bàn...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FDF8EE] min-h-screen">
      {ConfirmDialogComponent}
      <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#9F1514]/10 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-[#850A0A] flex items-center gap-3">
              <span className="bg-[#850A0A] w-1.5 h-8 rounded-full"></span>
              Sơ đồ bàn trực tuyến
            </h2>
            <p className="text-gray-500 italic mt-1">
              Cập nhật thời gian thực từ hệ thống
            </p>
          </div>

          <div className="flex gap-4 p-2 bg-white/50 rounded-lg border border-[#9F1514]/10 shadow-sm px-4">
            <StatusNote color="bg-gray-200" label="TRỐNG" />
            <StatusNote color="bg-[#9F1514]" label="CÓ KHÁCH" />
            <StatusNote color="bg-orange-400" label="ĐANG DỌN" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {tables.map((table) => (
            <TableCard
              key={table.TableID}
              table={table}
              onAction={onAction}
              isProcessing={processingTableId === table.TableID}
            />
          ))}
        </div>

        {qrModal.open && (
          <QrModal
            tableLabel={qrModal.tableLabel}
            orderId={qrModal.orderId}
            orderLink={qrModal.orderLink}
            toast={toast}
            onClose={() =>
              setQrModal({
                open: false,
                tableLabel: null,
                orderId: null,
                orderLink: "",
              })
            }
          />
        )}
      </div>
    </div>
  );
};

const TableCard = ({ table, onAction, isProcessing }) => {
  const id = table.TableID;
  const label = table.TableNumber || id;
  const status = parseInt(table.Status);
  const currentTotal = table.TotalAmount ? formatPrice(table.TotalAmount) : "0đ";

  const statusConfig = {
    0: {
      label: "TRỐNG",
      bgColor: "bg-white",
      borderColor: "border-gray-100",
      icon: <Coffee className="text-gray-200" size={24} />,
      btnColor: "bg-[#850A0A] text-white",
      actionLabel: "Mở bàn",
      nextStatus: 1,
    },
    1: {
      label: "CÓ KHÁCH",
      bgColor: "bg-[#850A0A]",
      borderColor: "border-[#850A0A]",
      icon: <UserCheck className="text-white/30" size={24} />,
      btnColor: "bg-[#FFF1CA] text-[#850A0A]",
      actionLabel: "Thanh toán",
      nextStatus: 3,
    },
    3: {
      label: "ĐANG DỌN",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: <Eraser className="text-orange-200" size={24} />,
      btnColor: "bg-white border-2 border-orange-200 text-orange-600",
      actionLabel: "Dọn xong",
      nextStatus: 0,
    },
  };

  const config = statusConfig[status] || statusConfig[0];

  return (
    <div
      className={`relative p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between h-56 shadow-sm hover:shadow-md
      ${config.bgColor} ${config.borderColor} ${status === 1 ? "text-white" : "text-gray-800"}
    `}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black">Bàn {label}</h3>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60`}>
            {config.label}
          </p>
        </div>
        {config.icon}
      </div>

      <div className="h-12 flex flex-col justify-center">
        {status === 1 && (
          <div>
             <p className="text-[10px] uppercase font-bold opacity-60">Tạm tính</p>
             <p className="text-xl font-bold text-[#FFF1CA]">{currentTotal}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction(id, config.nextStatus, label)}
          disabled={isProcessing}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${config.btnColor}`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              {status === 0 && <PlayCircle size={18} />}
              {status === 1 && <UserCheck size={18} />}
              {status === 3 && <Eraser size={18} />}
              {config.actionLabel}
            </>
          )}
        </button>
        <button className={`p-2.5 rounded-xl border-2 transition-all ${status === 1 ? "border-white/20 text-white/40 hover:bg-white/10" : "border-gray-50 text-gray-200 hover:bg-gray-50"}`}>
          <Edit3 size={18} />
        </button>
      </div>
    </div>
  );
};

const QrModal = ({ tableLabel, orderId, orderLink, toast, onClose }) => {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(orderLink)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(orderLink);
      toast.success("Đã copy", "Đã copy link gọi món vào bộ nhớ tạm.");
    } catch {
      toast.error("Lỗi copy", "Không copy được. Bạn hãy copy thủ công.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center">
          <h3 className="text-2xl font-black text-gray-800 mb-1">BÀN {tableLabel}</h3>
          <p className="text-gray-400 mb-6 font-mono text-[10px] uppercase">Order ID: #{orderId}</p>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
            <img src={qrSrc} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full border-2 border-[#850A0A] text-[#850A0A] py-3 rounded-xl font-bold hover:bg-[#850A0A]/5 transition-all active:scale-95"
            >
              Copy Link gọi món
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
            >
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusNote = ({ color, label }) => (
  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="uppercase tracking-widest">{label}</span>
  </div>
);

export default TableManagement;
