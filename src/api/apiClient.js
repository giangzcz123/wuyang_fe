// 👇 Khi chạy bình thường trên máy tính (chỉ mình anh xem)
// export const BASE_URL = "http://localhost/wuyang_be/api";

// 👇 Khi chạy qua Wi-Fi LAN (cùng phòng thi)
// export const BASE_URL = "http://192.168.1.9/wuyang_be/api";

// ✅ ĐANG DÙNG: Vercel Proxy → InfinityFree (không bị CORS vì cùng origin)
export const BASE_URL = "/backend";

export const request = async (endpoint, options = {}) => {
  const { body, headers, ...customConfig } = options;
  const config = {
    method: body ? "POST" : "GET",
    headers: { 
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers 
    },
    ...customConfig,
  };

  if (body && config.headers["Content-Type"] === "application/json") {
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Logic: Redirect về trang login nếu hết phiên
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi không xác định");
  }

  return response.json();
};
