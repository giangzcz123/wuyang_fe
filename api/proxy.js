const TARGET = "https://wuyangbe.lovestoblog.com/wuyang_be/api";

export default async function handler(req, res) {
  // Lấy path sau /api/proxy (ví dụ: /menu.php, /fetch_categories.php)
  const path = req.url.replace(/^\/api\/proxy/, "") || "/";

  // Tập hợp options để forward request
  const fetchOptions = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      // Giả lập browser để qua bot detection của InfinityFree
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
    },
  };

  // Nếu có body (POST request) thì forward luôn
  if (req.method !== "GET" && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(`${TARGET}${path}`, fetchOptions);
    const text = await response.text();

    // Kiểm tra có phải JSON không
    try {
      const json = JSON.parse(text);
      res.setHeader("Content-Type", "application/json");
      res.status(response.status).json(json);
    } catch {
      // InfinityFree trả về HTML (lỗi) — log ra để debug
      res.status(500).json({ error: "Backend trả về HTML, không phải JSON", raw: text.substring(0, 200) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
