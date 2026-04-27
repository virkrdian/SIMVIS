const app = require("../app");

module.exports = async (req, res) => {
  try {
    if (typeof req.url === "string" && !req.url.startsWith("/api/")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
  } catch {}

  return app(req, res);
};

