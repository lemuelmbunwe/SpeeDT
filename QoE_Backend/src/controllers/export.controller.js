/**
 * Export Controller
 *
 * Handles all operator data export requests.
 * Every route relies on req.operatorName which is set
 * by the authenticateOperator middleware.
 */

const exportService = require("../services/export.service");

/**
 * GET /api/export/device/:deviceId?format=json
 * GET /api/export/device/:deviceId?format=csv
 *
 * Export data for a single device (only if it belongs to this operator).
 */
const exportDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const format = req.query.format || "json";
    const operatorName = req.operatorName;

    if (format === "csv") {
      const csvData = await exportService.exportDeviceAsCsv(deviceId, operatorName);
      if (!csvData) {
        return res.status(404).json({
          success: false,
          error: "No data found for this device under your operator",
        });
      }

      // Return CSV as downloadable text with all three tables concatenated
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${csvData.filename}"`);
      const output = [
        "=== NETWORK METRICS ===",
        csvData.metrics_csv,
        "=== LOCATIONS ===",
        csvData.locations_csv,
        "=== FEEDBACK ===",
        csvData.feedback_csv,
      ].join("\n");
      return res.send(output);
    }

    // Default: JSON format
    const jsonData = await exportService.exportDeviceAsJson(deviceId, operatorName);
    if (!jsonData) {
      return res.status(404).json({
        success: false,
        error: "No data found for this device under your operator",
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="device_${deviceId.substring(0, 8)}.json"`);
    res.json({ success: true, data: jsonData });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/export/all?format=json
 * GET /api/export/all?format=csv
 *
 * Export ALL devices that belong to the authenticated operator.
 */
const exportAll = async (req, res, next) => {
  try {
    const format = req.query.format || "json";
    const operatorName = req.operatorName;

    if (format === "csv") {
      const csvData = await exportService.exportAllForOperatorAsCsv(operatorName);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${csvData.filename}"`);
      const output = [
        "=== NETWORK METRICS ===",
        csvData.metrics_csv,
        "=== LOCATIONS ===",
        csvData.locations_csv,
        "=== FEEDBACK ===",
        csvData.feedback_csv,
      ].join("\n");
      return res.send(output);
    }

    // Default: JSON format
    const allData = await exportService.exportAllForOperatorAsJson(operatorName);
    if (allData.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No devices found for your operator",
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="operator_${operatorName.replace(/\s+/g, "_")}_export.json"`);
    res.json({ success: true, total_devices: allData.length, data: allData });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/export/operators
 *
 * Returns the list of operators configured in the system.
 * Useful for an admin dashboard to know which operators exist.
 */
const getOperators = (req, res) => {
  const config = JSON.parse(process.env.OPERATOR_API_KEYS || "{}");
  const operators = Object.keys(config);
  res.json({ success: true, data: operators });
};

module.exports = {
  exportDevice,
  exportAll,
  getOperators,
};