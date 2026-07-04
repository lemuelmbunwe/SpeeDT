const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/download.bin", (req, res) => {
  const filePath = path.join(__dirname, "../../public/test-file-5mb.bin");
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(500).json({ success: false, error: "Failed to send download file." });
    }
  });
});

router.post("/upload", (req, res) => {
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
  });

  req.on("end", () => {
    res.json({ success: true, size_bytes: size });
  });

  req.on("error", () => {
    res.status(500).json({ success: false, error: "Upload failed." });
  });
});

router.get("/ping", (req, res) => {
  res.json({ success: true, timestamp: Date.now() });
});

module.exports = router;
