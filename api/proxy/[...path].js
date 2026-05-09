const https = require("https");
const http = require("http");
const { URL } = require("url");

const TARGET_BASE = "https://wuyangbe.lovestoblog.com/wuyang_be/api";

module.exports = async function handler(req, res) {
  try {
    // Lấy wildcard path từ query
    const pathSegments = req.query.path || [];
    const phpPath = "/" + (Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments);

    // Giữ lại query string gốc (bỏ phần "path" của vercel)
    const originalUrl = new URL(req.url, "http://localhost");
    originalUrl.searchParams.delete("path");
    const queryString = originalUrl.search;

    const targetUrl = `${TARGET_BASE}${phpPath}${queryString}`;

    // Đọc body nếu là POST
    let bodyData = "";
    if (req.method !== "GET") {
      bodyData = await new Promise((resolve, reject) => {
        let chunks = "";
        req.on("data", (chunk) => (chunks += chunk));
        req.on("end", () => resolve(chunks));
        req.on("error", reject);
      });
    }

    // Gọi InfinityFree
    const result = await new Promise((resolve, reject) => {
      const parsedUrl = new URL(targetUrl);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          "Accept": "application/json, */*",
          ...(bodyData ? { "Content-Length": Buffer.byteLength(bodyData) } : {}),
        },
      };

      const lib = parsedUrl.protocol === "https:" ? https : http;
      const proxyReq = lib.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => (data += chunk));
        proxyRes.on("end", () => resolve({ status: proxyRes.statusCode, body: data }));
      });

      proxyReq.on("error", reject);
      if (bodyData) proxyReq.write(bodyData);
      proxyReq.end();
    });

    // Trả về JSON hoặc debug
    try {
      const json = JSON.parse(result.body);
      res.setHeader("Content-Type", "application/json");
      return res.status(result.status).json(json);
    } catch {
      return res.status(500).json({
        error: "Backend không trả JSON",
        targetUrl,
        preview: result.body.substring(0, 300),
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};
