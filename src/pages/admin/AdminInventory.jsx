import React, { useState, useEffect } from "react";
import { Plus, Trash2, PackageSearch, ChefHat, ArrowDownToLine, Search, X } from "lucide-react";
import { request, BASE_URL } from "../../api/apiClient";
import { useToast } from "../../components/ui/Toast";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const AdminInventory = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [activeTab, setActiveTab] = useState("inventory");
  
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
  
  const [stockForm, setStockForm] = useState({ IngredientID: "", Quantity: "" });
  const [stockErrors, setStockErrors] = useState({});

  const [recipeForm, setRecipeForm] = useState({ ProductID: "", IngredientID: "", AmountRequired: "" });
  const [recipeErrors, setRecipeErrors] = useState({});

  const [newIngredientForm, setNewIngredientForm] = useState({ IngredientName: "", Unit: "kg", StockQuantity: "0" });
  const [ingredientErrors, setIngredientErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, recRes, prodRes] = await Promise.all([
        request("/admin_inventory.php"),
        request("/admin_recipe_management.php"),
        request("/admin_menu_crud.php")
      ]);
      setIngredients(Array.isArray(invRes) ? invRes : []);
      setRecipes(Array.isArray(recRes) ? recRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu kho:", error);
      toast.error("Lỗi tải dữ liệu", "Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // --- Validation helpers ---
  const validateStock = () => {
    const errors = {};
    if (!stockForm.IngredientID) errors.IngredientID = "Vui lòng chọn nguyên liệu";
    if (!stockForm.Quantity || Number(stockForm.Quantity) <= 0) errors.Quantity = "Số lượng phải lớn hơn 0";
    setStockErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRecipe = () => {
    const errors = {};
    if (!recipeForm.ProductID) errors.ProductID = "Vui lòng chọn món ăn";
    if (!recipeForm.IngredientID) errors.IngredientID = "Vui lòng chọn nguyên liệu";
    if (!recipeForm.AmountRequired || Number(recipeForm.AmountRequired) <= 0) errors.AmountRequired = "Định mức phải lớn hơn 0";
    setRecipeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateIngredient = () => {
    const errors = {};
    if (!newIngredientForm.IngredientName.trim()) errors.IngredientName = "Tên nguyên liệu không được để trống";
    else if (newIngredientForm.IngredientName.trim().length < 2) errors.IngredientName = "Tên nguyên liệu phải có ít nhất 2 ký tự";
    if (newIngredientForm.StockQuantity !== "" && Number(newIngredientForm.StockQuantity) < 0) errors.StockQuantity = "Tồn kho không được âm";
    setIngredientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Handlers ---
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!validateStock()) return;
    try {
      setSubmitting(true);
      await request("/admin_inventory.php", {
        method: "POST",
        body: {
          IngredientID: Number(stockForm.IngredientID),
          Quantity: Number(stockForm.Quantity)
        }
      });
      setIsStockModalOpen(false);
      setStockForm({ IngredientID: "", Quantity: "" });
      setStockErrors({});
      toast.success("Nhập kho thành công!", "Số lượng tồn kho đã được cập nhật.");
      fetchData();
    } catch {
      toast.error("Nhập kho thất bại!", "Không thể cập nhật tồn kho. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    if (!validateRecipe()) return;
    try {
      setSubmitting(true);
      await request("/admin_recipe_management.php", {
        method: "POST",
        body: {
          ProductID: Number(recipeForm.ProductID),
          IngredientID: Number(recipeForm.IngredientID),
          AmountRequired: Number(recipeForm.AmountRequired)
        }
      });
      setIsRecipeModalOpen(false);
      setRecipeForm({ ProductID: "", IngredientID: "", AmountRequired: "" });
      setRecipeErrors({});
      toast.success("Tạo định mức thành công!", "Công thức đã được lưu vào hệ thống.");
      fetchData();
    } catch {
      toast.error("Tạo định mức thất bại!", "Định mức này có thể đã tồn tại hoặc có lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (productId, ingredientId) => {
    const product = products.find(p => p.ProductID == productId);
    const ingredient = ingredients.find(i => i.IngredientID == ingredientId);
    const pName = product?.ProductName || `Món #${productId}`;
    const iName = ingredient?.IngredientName || `NL #${ingredientId}`;
    const ok = await confirm({
      title: "Gỡ định mức?",
      message: `Bạn có chắc chắn muốn xoá định mức "${iName}" khỏi món "${pName}"?`,
      type: "danger",
      confirmText: "Xác nhận gỡ"
    });
    if (!ok) return;
    try {
      const params = new URLSearchParams({ ProductID: productId, IngredientID: ingredientId });
      await fetch(`${BASE_URL}/admin_recipe_management.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      toast.success("Đã xoá định mức", `Đã gỡ "${iName}" khỏi "${pName}".`);
      fetchData();
    } catch {
      toast.error("Xoá thất bại!", "Không thể xoá định mức. Vui lòng thử lại.");
    }
  };

  const handleNewIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!validateIngredient()) return;
    try {
      setSubmitting(true);
      await request("/admin_inventory.php", {
        method: "PUT",
        body: {
          IngredientName: newIngredientForm.IngredientName.trim(),
          Unit: newIngredientForm.Unit,
          StockQuantity: Number(newIngredientForm.StockQuantity)
        }
      });
      setIsNewIngredientModalOpen(false);
      setNewIngredientForm({ IngredientName: "", Unit: "kg", StockQuantity: "0" });
      setIngredientErrors({});
      toast.success("Tạo nguyên liệu thành công!", `"${newIngredientForm.IngredientName}" đã được thêm vào kho.`);
      fetchData();
    } catch {
      toast.error("Thêm nguyên liệu thất bại!", "Vui lòng thử lại hoặc kiểm tra kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const ErrorText = ({ msg }) => msg ? <p className="text-red-500 text-xs font-bold mt-1">{msg}</p> : null;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {ConfirmDialogComponent}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="bg-emerald-600 w-1.5 h-8 rounded-full"></span>
            Kho & Định Mức
          </h2>
          <p className="text-gray-500 mt-1">Quản lý nguyên vật liệu và công thức trừ kho</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-2xl w-full md:w-max shadow-sm">
         <button 
           onClick={() => setActiveTab('inventory')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
         >
           <PackageSearch size={18} /> Tồn kho Nguyên liệu
         </button>
         <button 
           onClick={() => setActiveTab('recipes')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'recipes' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
         >
           <ChefHat size={18} /> Công thức (Recipes)
         </button>
      </div>

      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[65vh]">
        <div className="p-4 border-b border-emerald-50 flex flex-col sm:flex-row justify-between gap-4 bg-[#F2FBF6]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'inventory' ? "Tìm nguyên liệu..." : "Tìm món ăn hoặc nguyên liệu..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => activeTab === 'inventory' ? setIsStockModalOpen(true) : setIsRecipeModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              {activeTab === 'inventory' ? (
                <><ArrowDownToLine size={20} /> Nhập Kho</>
              ) : (
                <><Plus size={20} /> Tạo Định Mức</>
              )}
            </button>
            {activeTab === 'inventory' && (
              <button 
                onClick={() => setIsNewIngredientModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} /> Thêm Nguyên Liệu
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : activeTab === 'inventory' ? (
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b-2 border-emerald-100">
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">ID</th>
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">Tên Nguyên Liệu</th>
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Tồn Kho (Thực Tế)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {ingredients
                    .filter(i => i.IngredientName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                   <tr key={item.IngredientID} className="hover:bg-emerald-50/50 transition-colors">
                     <td className="px-4 py-4 text-gray-400 font-mono text-sm">#{item.IngredientID}</td>
                     <td className="px-4 py-4 font-bold text-gray-800">{item.IngredientName}</td>
                     <td className="px-4 py-4 text-right">
                        {item.StockQuantity <= 0 ? (
                           <span className="text-red-500 font-black bg-red-50 px-3 py-1 rounded-full text-xs box-border border-red-200 border">Hết hàng</span>
                        ) : (
                           <span className="text-emerald-700 font-black text-lg bg-emerald-50 px-3 py-1 rounded-md">{parseFloat(item.StockQuantity)}</span>
                        )}
                        <span className="text-gray-400 text-xs ml-1">{item.Unit}</span>
                     </td>
                   </tr>
                 ))}
                 {ingredients.length === 0 && (
                   <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-bold">Không có nguyên liệu nào. Bấm "Thêm Nguyên Liệu" để tạo mới.</td></tr>
                 )}
               </tbody>
             </table>
          ) : (
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b-2 border-emerald-100">
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">Món Ăn</th>
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">Nguyên Liệu Cần Trừ</th>
                   <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest">Định Mức</th>
                   <th className="px-4 py-3"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {recipes
                    .filter(r => r.ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.IngredientName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(r => (
                   <tr key={`${r.ProductID}-${r.IngredientID}`} className="hover:bg-emerald-50/50 transition-colors">
                     <td className="px-4 py-4 font-black flex items-center gap-2 text-orange-600">
                       <ChefHat size={16} className="text-orange-300" /> {r.ProductName}
                     </td>
                     <td className="px-4 py-4 font-bold text-gray-700">{r.IngredientName}</td>
                     <td className="px-4 py-4">
                       <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-1 rounded-md text-sm">{parseFloat(r.AmountRequired)}</span>
                     </td>
                     <td className="px-4 py-4 text-right">
                       <button 
                         onClick={() => handleDeleteRecipe(r.ProductID, r.IngredientID)}
                         className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         title="Gỡ định mức"
                       >
                         <Trash2 size={18} />
                       </button>
                     </td>
                   </tr>
                 ))}
                 {recipes.length === 0 && (
                   <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic font-bold">Chưa có công thức nào được thiết lập.</td></tr>
                 )}
               </tbody>
             </table>
          )}
        </div>
      </div>

      {/* Modal Nhập Kho */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setIsStockModalOpen(false); setStockErrors({}); }} />
          <div className="relative w-full max-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F2FBF6]">
               <h3 className="font-black text-xl text-emerald-800">Cộng thêm Tồn Kho</h3>
               <button onClick={() => { setIsStockModalOpen(false); setStockErrors({}); }} className="text-gray-400 hover:text-red-500 transition-colors">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nguyên Liệu</label>
                  <select 
                    value={stockForm.IngredientID}
                    onChange={e => { setStockForm({...stockForm, IngredientID: e.target.value}); setStockErrors({...stockErrors, IngredientID: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold appearance-none bg-white transition-colors ${stockErrors.IngredientID ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-emerald-500"}`}
                  >
                    <option value="" disabled>Chọn nguyên liệu nhập</option>
                    {ingredients.map(i => (
                       <option key={i.IngredientID} value={i.IngredientID}>{i.IngredientName} ({i.Unit})</option>
                    ))}
                  </select>
                  <ErrorText msg={stockErrors.IngredientID} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Số lượng nhập (Cộng thêm)</label>
                  <input 
                    type="number" step="0.01" min="0.01"
                    value={stockForm.Quantity}
                    onChange={e => { setStockForm({...stockForm, Quantity: e.target.value}); setStockErrors({...stockErrors, Quantity: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold transition-colors ${stockErrors.Quantity ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-emerald-500"}`}
                    placeholder="VD: 10.5"
                  />
                  <ErrorText msg={stockErrors.Quantity} />
               </div>
               <button type="submit" disabled={submitting} className="w-full py-3 mt-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/30 disabled:opacity-60 flex items-center justify-center gap-2">
                 {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</> : "Xác nhận nhập"}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Công Thức */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setIsRecipeModalOpen(false); setRecipeErrors({}); }} />
          <div className="relative w-full max-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
               <h3 className="font-black text-xl text-orange-800">Tạo công thức trừ kho</h3>
               <button onClick={() => { setIsRecipeModalOpen(false); setRecipeErrors({}); }} className="text-gray-400 hover:text-red-500 transition-colors">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleRecipeSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Món ăn bán ra</label>
                  <select 
                    value={recipeForm.ProductID}
                    onChange={e => { setRecipeForm({...recipeForm, ProductID: e.target.value}); setRecipeErrors({...recipeErrors, ProductID: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold appearance-none bg-white transition-colors ${recipeErrors.ProductID ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-orange-500"}`}
                  >
                    <option value="" disabled>Chọn món ăn</option>
                    {products.map(p => (
                       <option key={p.ProductID} value={p.ProductID}>{p.ProductName}</option>
                    ))}
                  </select>
                  <ErrorText msg={recipeErrors.ProductID} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nguyên liệu bị trừ</label>
                  <select 
                    value={recipeForm.IngredientID}
                    onChange={e => { setRecipeForm({...recipeForm, IngredientID: e.target.value}); setRecipeErrors({...recipeErrors, IngredientID: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold appearance-none bg-white transition-colors ${recipeErrors.IngredientID ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-orange-500"}`}
                  >
                    <option value="" disabled>Chọn nguyên liệu trích xuất</option>
                    {ingredients.map(i => (
                       <option key={i.IngredientID} value={i.IngredientID}>{i.IngredientName} ({i.Unit})</option>
                    ))}
                  </select>
                  <ErrorText msg={recipeErrors.IngredientID} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Định mức trừ kho</label>
                  <input 
                    type="number" step="0.001" min="0.001"
                    value={recipeForm.AmountRequired}
                    onChange={e => { setRecipeForm({...recipeForm, AmountRequired: e.target.value}); setRecipeErrors({...recipeErrors, AmountRequired: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold transition-colors ${recipeErrors.AmountRequired ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-orange-500"}`}
                    placeholder="Số lượng bị trừ khi bán (VD: 0.2)"
                  />
                  <ErrorText msg={recipeErrors.AmountRequired} />
               </div>
               <button type="submit" disabled={submitting} className="w-full py-3 mt-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/30 disabled:opacity-60 flex items-center justify-center gap-2">
                 {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</> : "Lưu định mức"}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Nguyên Liệu Mới */}
      {isNewIngredientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setIsNewIngredientModalOpen(false); setIngredientErrors({}); }} />
          <div className="relative w-full max-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
               <h3 className="font-black text-xl text-indigo-800">Thêm Nguyên Liệu Mới</h3>
               <button onClick={() => { setIsNewIngredientModalOpen(false); setIngredientErrors({}); }} className="text-gray-400 hover:text-red-500 transition-colors">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleNewIngredientSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tên nguyên liệu *</label>
                  <input 
                    type="text"
                    value={newIngredientForm.IngredientName}
                    onChange={e => { setNewIngredientForm({...newIngredientForm, IngredientName: e.target.value}); setIngredientErrors({...ingredientErrors, IngredientName: ""}); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold transition-colors ${ingredientErrors.IngredientName ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-indigo-500"}`}
                    placeholder="VD: Thịt bò"
                  />
                  <ErrorText msg={ingredientErrors.IngredientName} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Đơn vị</label>
                     <select 
                       value={newIngredientForm.Unit}
                       onChange={e => setNewIngredientForm({...newIngredientForm, Unit: e.target.value})}
                       className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-semibold appearance-none bg-white"
                     >
                       <option value="kg">kg</option>
                       <option value="g">g</option>
                       <option value="ml">ml</option>
                       <option value="lít">lít</option>
                       <option value="cái">cái</option>
                       <option value="hộp">hộp</option>
                       <option value="quả">quả</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tồn ban đầu</label>
                     <input 
                       type="number" step="0.01" min="0"
                       value={newIngredientForm.StockQuantity}
                       onChange={e => { setNewIngredientForm({...newIngredientForm, StockQuantity: e.target.value}); setIngredientErrors({...ingredientErrors, StockQuantity: ""}); }}
                       className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-semibold transition-colors ${ingredientErrors.StockQuantity ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-indigo-500"}`}
                       placeholder="0"
                     />
                     <ErrorText msg={ingredientErrors.StockQuantity} />
                  </div>
               </div>
               <button type="submit" disabled={submitting} className="w-full py-3 mt-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 disabled:opacity-60 flex items-center justify-center gap-2">
                 {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tạo...</> : "Tạo nguyên liệu"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
