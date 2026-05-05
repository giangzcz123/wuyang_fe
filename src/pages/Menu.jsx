import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CustomerMenu from "../pages/CustomerMenu";
import SignInPage from "./SignInPage";
import { request } from "../api/apiClient";
const categoryImages = {
  All: "/all.png",
  Lẩu: "/lau.png",
  Heo: "/heo.png",
  Cừu: "/cuu.png",
  "Nội tạng": "/noitang.png",
  "Hải sản": "/haisan.png",
  "Rau & nấm": "/rau.png",
  "Há cảo & sủi ": "/hacao.png",
  Rau: "/rau.png",
  Mỳ: "/my.png",
  Bò: "/bo.png",
  default: "/assets/categories/default.png",
};

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // State cho danh sách đã lọc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Danh mục và Sản phẩm
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catData, rawMenuData] = await Promise.all([
          request("/fetch_categories.php"),
          request("/menu.php"),
        ]);

        // --- XỬ LÝ DỮ LIỆU ĐỂ LỌC THEO TÊN ---
        // Duyệt qua từng Category, sau đó map vào danh sách sản phẩm để gắn kèm tên danh mục
        const allProducts = rawMenuData.flatMap((category) =>
          category.Products.map((product) => ({
            ...product,
            CategoryName: category.CategoryName, // Gắn thêm tên danh mục vào từng món để lọc
          })),
        );

        setCategories([{ CategoryID: "all", CategoryName: "All" }, ...catData]);
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = products;

    // Lọc theo Tên Danh Mục
    if (activeCategory !== "all") {
      // Tìm object danh mục đang chọn để lấy ra cái Tên (CategoryName)
      const selectedCat = categories.find(
        (c) => c.CategoryID === activeCategory,
      );

      if (selectedCat) {
        // Lọc những sản phẩm có CategoryName trùng với tên danh mục vừa tìm được
        result = result.filter(
          (item) => item.CategoryName === selectedCat.CategoryName,
        );
      }
    }

    // Lọc theo từ khóa tìm kiếm (Tên sản phẩm)
    if (searchTerm.trim() !== "") {
      result = result.filter((item) =>
        item.ProductName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredProducts(result);
  }, [activeCategory, searchTerm, products, categories]);

  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Ngăn load lại trang, logic lọc đã nằm trong useEffect ở trên
  };

  if (loading) return;

  <div class="relative items-center block max-w-sm p-6 bg-neutral-primary-soft border border-default rounded-base shadow-xs">
    <h5 class="mb-2 text-xl font-semibold tracking-tight text-heading opacity-20">
      Noteworthy technology acquisitions 2021
    </h5>
    <p class="font-normal text-body opacity-20">
      Here are the biggest enterprise technology acquisitions of 2021 so far, in
      reverse chronological order.
    </p>
    <div
      role="status"
      class="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2"
    >
      <svg
        aria-hidden="true"
        class="w-8 h-8 w-8 h-8 text-neutral-tertiary animate-spin fill-brand"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Loading...</span>
    </div>
  </div>;

  if (error)
    return <div className="text-center py-10 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="bg-[#FAF9F7] min-h-screen">
      <Header />

      <div className="mx-auto bg-white pt-20 pb-2 shadow-sm mt-24">
        {/* --- Thanh cuộn ngang Categories --- */}
        <div className="w-[80%] mx-auto flex overflow-x-auto px-4 pb-4 no-scrollbar p-1 sm:p-4">
          {categories.map((category) => {
            const imgSrc =
              categoryImages[category.CategoryName] ||
              categoryImages["default"];
            const isActive = activeCategory === category.CategoryID;

            return (
              <div
                key={category.CategoryID}
                onClick={() => setActiveCategory(category.CategoryID)}
                className="flex flex-col items-center w-full mx-auto cursor-pointer group snap-start"
              >
                <div
                  className={`w-16 h-16 md:w-25 md:h-25 rounded-full overflow-hidden border-[3px] transition-all 
                  ${isActive ? "border-red-500 scale-110 shadow-lg" : "border-transparent opacity-70"}`}
                >
                  <img
                    src={imgSrc}
                    alt={category.CategoryName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className={`text-xs mt-2 ${isActive ? "font-bold text-red-600" : "text-gray-500"}`}
                >
                  {category.CategoryName}
                </span>
              </div>
            );
          })}
        </div>

        {/* --- Thanh tìm kiếm --- */}
        <div className="mb-6 w-[80%] mx-auto mt-2 sm:mt-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative group w-full max-w-md mx-auto"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D92128] to-[#F3B05A] rounded-full blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center w-full bg-[#FFFBF5] rounded-full border-[2px] border-[#D92128] shadow-sm overflow-hidden">
              <div className="pl-4 pr-2 text-[#D92128]">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent py-2.5 outline-none text-[#5A3D3C] placeholder-[#D92128]/50 font-medium"
                placeholder="Tìm món nhúng, nước lẩu..."
              />
              <button
                type="submit"
                className="bg-[#D92128] text-[#FFFBF5] px-6 py-2.5 font-bold hover:bg-[#B81D22]"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>
        {/* --- Danh sách sản phẩm sau khi lọc --- */}
        <div className="max-w-screen-xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((item, id) => (
              <div
                key={id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                <img
                  src={item.ImageURL || "/assets/default-food.png"}
                  alt={item.ProductName}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">
                    {item.ProductName}
                  </h3>
                  <p className="text-red-600 font-bold mt-2">
                    {Number(item.Price).toLocaleString()}đ
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 italic">
              Không tìm thấy món nào phù hợp...
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* <CustomerMenu /> */}
      {/* <SignInPage /> */}
    </div>
  );
};

export default Menu;
