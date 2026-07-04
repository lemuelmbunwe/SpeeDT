const express = require("express");
const cors = require("cors");
const deviceRoutes = require("./routes/device.routes");
const metricsRoutes = require("./routes/metrics.routes");
const locationRoutes = require("./routes/location.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const exportRoutes = require("./routes/export.routes");
const testFilesRoutes = require("./routes/test-files.routes");
const { initWeeklyExportScheduler } = require("./services/scheduler.service");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "QoE Backend is running" });
});

app.use("/api/devices", deviceRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/test-files", testFilesRoutes);

// Initialize weekly export scheduler
if (process.env.NODE_ENV !== "test") {
  initWeeklyExportScheduler();
}

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
