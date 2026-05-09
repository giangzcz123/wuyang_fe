const TARGET_BASE = "https://wuyangbe.lovestoblog.com/wuyang_be/api";

export default async function handler(req, res) {
  // Lấy wildcard path: ["menu.php"] hoặc ["fetch_categories.php"]
  const pathSegments = req.query.path || [];
  const phpPath = "/" + (Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments);

  // Giữ lại query string nếu có (ví dụ: ?TableID=5&token=abc)
  const urlObj = new URL(req.url, "http://localhost");
  const queryString = urlObj.search; // "?TableID=5&token=abc" hoặc ""

  const targetUrl = `${TARGET_BASE}${phpPath}${queryString}`;

  const fetchOptions = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "vi-VN,vi;q=0.9",
    },
  };

  // Forward body nếu là POST
  if (req.method !== "GET" && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const text = await response.text();

    // Parse JSON nếu được
    try {
      const json = JSON.parse(text);
      res.setHeader("Content-Type", "application/json");
      return res.status(response.status).json(json);
    } catch {
      // Trả về raw text để debug
      return res.status(500).json({
        error: "Backend không trả JSON",
        targetUrl,
        preview: text.substring(0, 300),
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message, targetUrl });
  }
}
