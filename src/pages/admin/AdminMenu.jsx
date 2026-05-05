import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { request, BASE_URL } from "../../api/apiClient";
import { formatPrice } from "../../utils/format";
import { ToastContainer, useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const AdminMenu = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    CategoryID: "",
    ProductName: "",
    Price: "",
    ImageURL: "",
    IsAvailable: "1"
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        request("/admin_menu_crud.php"),
        request("/fetch_categories.php")
      ]);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Lỗi tải dữ liệu", "Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        CategoryID: product.CategoryID || "",
        ProductName: product.ProductName || "",
        Price: product.Price || "",
        ImageURL: product.ImageURL || "",
        IsAvailable: product.IsAvailable?.toString() || "1"
      });
    } else {
      setEditingProduct(null);
      setFormData({
        CategoryID: categories[0]?.CategoryID || "",
        ProductName: "",
        Price: "",
        ImageURL: "",
        IsAvailable: "1"
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate if it's an image
    if (!file.type.startsWith("image/")) {
      toast.warning("File không hợp lệ", "Vui lòng chọn một tệp hình ảnh.");
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      // Use the absolute URL for the PHP upload script
      const response = await fetch(`${BASE_URL}/upload_image.php`, {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, ImageURL: result.url }));
        toast.success("Tải ảnh lên thành công", "Ảnh món ăn đã được cập nhật.");
      } else {
        toast.error("Lỗi tải ảnh", result.error || "Không thể tải ảnh lên.");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống", "Lỗi kết nối khi tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.CategoryID || !formData.ProductName || !formData.Price) {
      toast.warning("Thiếu thông tin", "Vui lòng nhập đủ Danh mục, Tên món và Giá!");
      return;
    }

    try {
      if (editingProduct) {
        // PUT request using URLSearchParams for parse_str compatibility in PHP
        const params = new URLSearchParams({
          ProductID: editingProduct.ProductID,
          CategoryID: formData.CategoryID,
          ProductName: formData.ProductName,
          Price: formData.Price,
          ImageURL: formData.ImageURL,
          IsAvailable: formData.IsAvailable
        });
        
        await fetch(`${BASE_URL}/admin_menu_crud.php`, {
          method: "PUT",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });
      } else {
        // POST request uses JSON in PHP config
        await request("/admin_menu_crud.php", {
          method: "POST",
          body: {
            CategoryID: Number(formData.CategoryID),
            ProductName: formData.ProductName,
            Price: Number(formData.Price),
            ImageURL: formData.ImageURL,
            IsAvailable: Number(formData.IsAvailable)
          }
        });
      }
      closeModal();
      toast.success(editingProduct ? "Đã cập nhật" : "Đã thêm món", `Món "${formData.ProductName}" đã được lưu.`);
      fetchData(); // Reload list
    } catch (error) {
      toast.error("Lỗi hệ thống", "Lỗi lưu món ăn. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (productId) => {
    const product = products.find(p => p.ProductID === productId);
    const ok = await confirm({
      title: "Xóa món ăn?",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn món "${product?.ProductName || 'này'}"?`,
      confirmText: "Xóa ngay",
      type: "danger"
    });
    if (!ok) return;
    
    try {
      const params = new URLSearchParams({ ProductID: productId });
      await fetch(`${BASE_URL}/admin_menu_crud.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      toast.success("Đã xóa", "Món ăn đã được loại bỏ khỏi thực đơn.");
      fetchData();
    } catch (error) {
      toast.error("Lỗi", "Xóa thất bại!");
    }
  };

  const filteredProducts = products.filter(p => 
    p.ProductName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {ConfirmDialogComponent}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="bg-orange-500 w-1.5 h-8 rounded-full"></span>
            Quản lý Thực đơn
          </h2>
          <p className="text-gray-500 mt-1">Cập nhật danh sách món, thêm ảnh và điều chỉnh giá</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} />
          Thêm Món Mới
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-20 text-gray-400 font-bold italic">Không tìm thấy món ăn nào.</div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredProducts.map(product => {
                  const categoryName = categories.find(c => String(c.CategoryID) === String(product.CategoryID))?.CategoryName || 'Khác';
                  return (
                    <div key={product.ProductID} className="bg-white border hover:border-orange-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                      {product.IsAvailable == 0 && (
                         <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-md border border-red-200 z-10">
                           HẾT MÓN
                         </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center">
                          {product.ImageURL ? (
                            <img src={product.ImageURL} alt={product.ProductName} className={`w-full h-full object-cover ${product.IsAvailable == 0 ? 'grayscale' : ''}`} />
                          ) : (
                            <ImageIcon size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] uppercase font-bold text-orange-500 mb-1 tracking-wider">{categoryName}</p>
                           <h3 className={`font-black text-gray-800 truncate mb-1 ${product.IsAvailable == 0 ? 'text-gray-400' : ''}`}>{product.ProductName}</h3>
                           <p className="text-lg font-bold text-[#850A0A]">{formatPrice(product.Price)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                         <button 
                           onClick={() => handleOpenModal(product)}
                           className="flex-1 py-2 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                         >
                           <Edit2 size={16} /> Sửa
                         </button>
                         <button 
                           onClick={() => handleDelete(product.ProductID)}
                           className="flex-1 py-2 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                         >
                           <Trash2 size={16} /> Xóa
                         </button>
                      </div>
                    </div>
                  );
               })}
             </div>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-black text-xl text-gray-800">
                 {editingProduct ? "Chỉnh sửa món ăn" : "Thêm món mới"}
               </h3>
               <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                 <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               {/* Phần Ảnh Món Ăn - Thay thế input URL bằng upload */}
               <div className="mb-6 flex flex-col items-center">
                  <p className="w-full text-left text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Hình ảnh món ăn</p>
                  <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-500 transition-all flex items-center justify-center bg-gray-50 cursor-pointer" 
                       onClick={() => fileInputRef.current?.click()}>
                    {formData.ImageURL ? (
                      <img src={formData.ImageURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <Upload size={24} />
                        <span className="text-[10px] mt-1 font-bold">TẢI ẢNH</span>
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Thay đổi</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  <p className="mt-2 text-[10px] text-gray-400 italic">Hỗ trợ JPG, PNG, JPEG. Tối đa 5MB.</p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tên món ăn <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.ProductName}
                    onChange={e => setFormData({...formData, ProductName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-semibold transition-all"
                    placeholder="VD: Ba chỉ bò Mỹ"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Danh mục <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={formData.CategoryID}
                      onChange={e => setFormData({...formData, CategoryID: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold appearance-none bg-white"
                    >
                      <option value="" disabled>Chọn danh mục</option>
                      {categories.map(c => (
                         <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Giá tiền (VNĐ) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={formData.Price}
                      onChange={e => setFormData({...formData, Price: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold"
                      placeholder="VD: 55000"
                    />
                 </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tình trạng phục vụ</label>
                  <select 
                    value={formData.IsAvailable}
                    onChange={e => setFormData({...formData, IsAvailable: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold appearance-none bg-white"
                  >
                    <option value="1">Đang phục vụ</option>
                    <option value="0">Tạm hết món</option>
                  </select>
               </div>
               
               <div className="pt-4 mt-6 border-t border-gray-100 flex gap-3">
                 <button 
                   type="button" 
                   onClick={closeModal}
                   className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                 >
                   Hủy bỏ
                 </button>
                 <button 
                   type="submit" 
                   disabled={uploading}
                   className={`flex-1 px-6 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all active:scale-95 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {editingProduct ? "Lưu thay đổi" : "Tạo món mới"}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
