/**
 * Export Service
 *
 * Handles all operator data export logic:
 *   - Export single device as JSON
 *   - Export all devices for an operator as JSON
 *   - Export single device as CSV (multiple files zipped)
 *   - Export all devices for an operator as CSV (multiple files zipped)
 *   - Automated weekly export file generation
 *
 * All queries are automatically filtered by operator_name
 * so an operator can never see another operator's data.
 */

const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
// Helper: Generate metadata date range from rows
// ──────────────────────────────────────────────
const buildDateRange = (rows) => {
  if (!rows || rows.length === 0) {
    return { from: null, to: null };
  }
  const dates = rows.map((r) => new Date(r.recorded_at).toISOString());
  return {
    from: dates.reduce((a, b) => (a < b ? a : b)),
    to: dates.reduce((a, b) => (a > b ? a : b)),
  };
};

// ──────────────────────────────────────────────
// 1. Fetch all data for a single device
//    Filtered by operator_name for security.
// ──────────────────────────────────────────────
const getDeviceExportData = async (anonymousId, operatorName) => {
  // Fetch metrics — automatically filtered by operator
  const metricsQuery = `
    SELECT * FROM network_metric
    WHERE anonymous_id = $1
      AND operator_name = $2
    ORDER BY recorded_at DESC
  `;
  const metricsResult = await pool.query(metricsQuery, [anonymousId, operatorName]);
  const metrics = metricsResult.rows;

  // Fetch locations for this device
  const locationsQuery = `
    SELECT * FROM location
    WHERE anonymous_id = $1
    ORDER BY recorded_at DESC
  `;
  const locationsResult = await pool.query(locationsQuery, [anonymousId]);
  const locations = locationsResult.rows;

  // Fetch feedback for this device
  const feedbackQuery = `
    SELECT * FROM feedback
    WHERE anonymous_id = $1
    ORDER BY recorded_at DESC
  `;
  const feedbackResult = await pool.query(feedbackQuery, [anonymousId]);
  const feedback = feedbackResult.rows;

  // Fetch device info
  const deviceQuery = `SELECT * FROM subscriber_device WHERE anonymous_id = $1`;
  const deviceResult = await pool.query(deviceQuery, [anonymousId]);
  const deviceInfo = deviceResult.rows[0] || null;

  return { metrics, locations, feedback, deviceInfo };
};

// ──────────────────────────────────────────────
// 2. Build a comprehensive JSON export document
// ──────────────────────────────────────────────
const buildJsonExport = (anonymousId, operatorName, data) => {
  const { metrics, locations, feedback, deviceInfo } = data;
  const dateRange = buildDateRange(metrics);
  const uniqueOperators = [...new Set(metrics.map((m) => m.operator_name).filter(Boolean))];
  const uniqueLocations = [...new Set(locations.map((l) => l.location_name).filter(Boolean))];
  const uniqueNetworkTypes = [...new Set(metrics.map((m) => m.network_type).filter(Boolean))];

  // Compute summary stats
  const speedsWithData = metrics.filter((m) => m.download_mbps !== null);
  const avgDownload =
    speedsWithData.length > 0
      ? parseFloat(
          (speedsWithData.reduce((sum, m) => sum + parseFloat(m.download_mbps), 0) / speedsWithData.length).toFixed(2)
        )
      : null;

  const avgUpload =
    speedsWithData.length > 0
      ? parseFloat(
          (speedsWithData.reduce((sum, m) => sum + parseFloat(m.upload_mbps || 0), 0) / speedsWithData.length).toFixed(2)
        )
      : null;

  const latenciesWithData = metrics.filter((m) => m.latency_ms !== null);
  const avgLatency =
    latenciesWithData.length > 0
      ? parseFloat(
          (latenciesWithData.reduce((sum, m) => sum + parseFloat(m.latency_ms), 0) / latenciesWithData.length).toFixed(2)
        )
      : null;

  return {
    export_metadata: {
      generated_at: new Date().toISOString(),
      operator: operatorName,
      device_id: anonymousId,
      total_metrics: metrics.length,
      total_locations: locations.length,
      total_feedback: feedback.length,
      date_range: dateRange,
    },
    device_info: deviceInfo
      ? {
          device_model: deviceInfo.device_model,
          os: deviceInfo.os,
          app_version: deviceInfo.app_version,
          consent_given: deviceInfo.consent_given,
          data_collection_enabled: deviceInfo.data_collection_enabled,
          created_at: deviceInfo.created_at,
        }
      : null,
    network_metrics: metrics.map((m) => ({
      recorded_at: m.recorded_at,
      network_type: m.network_type,
      operator: m.operator_name,
      signal_strength_dbm: m.signal_strength_dbm,
      download_mbps: m.download_mbps ? parseFloat(m.download_mbps) : null,
      upload_mbps: m.upload_mbps ? parseFloat(m.upload_mbps) : null,
      latency_ms: m.latency_ms ? parseFloat(m.latency_ms) : null,
      jitter_ms: m.jitter_ms ? parseFloat(m.jitter_ms) : null,
      packet_loss_pct: m.packet_loss_pct ? parseFloat(m.packet_loss_pct) : null,
    })),
    locations: locations.map((l) => ({
      recorded_at: l.recorded_at,
      latitude: parseFloat(l.latitude),
      longitude: parseFloat(l.longitude),
      location_name: l.location_name,
    })),
    feedback: feedback.map((f) => ({
      recorded_at: f.recorded_at,
      overall_rating: f.overall_rating,
      speed_rating: f.speed_rating,
      delay_rating: f.delay_rating,
      reliability_rating: f.reliability_rating,
      comment: f.comment,
    })),
    summary: {
      avg_download_mbps: avgDownload,
      avg_upload_mbps: avgUpload,
      avg_latency_ms: avgLatency,
      total_speed_tests: speedsWithData.length,
      operators_detected: uniqueOperators,
      coverage_locations: uniqueLocations,
      network_types_encountered: uniqueNetworkTypes,
    },
  };
};

// ──────────────────────────────────────────────
// 3. Fetch all device IDs for a given operator
// ──────────────────────────────────────────────
const getAllDeviceIdsForOperator = async (operatorName) => {
  const query = `
    SELECT DISTINCT anonymous_id
    FROM network_metric
    WHERE operator_name = $1
    ORDER BY anonymous_id
  `;
  const result = await pool.query(query, [operatorName]);
  return result.rows.map((r) => r.anonymous_id);
};

// ──────────────────────────────────────────────
// 4. Export single device as JSON
// ──────────────────────────────────────────────
const exportDeviceAsJson = async (anonymousId, operatorName) => {
  const data = await getDeviceExportData(anonymousId, operatorName);
  if (data.metrics.length === 0 && data.locations.length === 0 && data.feedback.length === 0) {
    return null; // No data for this operator
  }
  return buildJsonExport(anonymousId, operatorName, data);
};

// ──────────────────────────────────────────────
// 5. Export all devices for an operator as JSON array
// ──────────────────────────────────────────────
const exportAllForOperatorAsJson = async (operatorName) => {
  const deviceIds = await getAllDeviceIdsForOperator(operatorName);
  const exports = [];

  for (const deviceId of deviceIds) {
    const data = await getDeviceExportData(deviceId, operatorName);
    if (data.metrics.length > 0) {
      exports.push(buildJsonExport(deviceId, operatorName, data));
    }
  }

  return exports;
};

// ──────────────────────────────────────────────
// 6. Generate CSV string from an array of objects
// ──────────────────────────────────────────────
const toCsv = (rows, columns) => {
  if (!rows || rows.length === 0) return columns.join(",") + "\n";

  const header = columns.join(",");
  const lines = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col];
        if (val === null || val === undefined) return "";
        val = String(val);
        // Escape commas and quotes
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",");
  });

  return header + "\n" + lines.join("\n") + "\n";
};

// ──────────────────────────────────────────────
// 7. Export single device as CSV (returns object with csv strings)
// ──────────────────────────────────────────────
const exportDeviceAsCsv = async (anonymousId, operatorName) => {
  const data = await getDeviceExportData(anonymousId, operatorName);
  if (data.metrics.length === 0 && data.locations.length === 0 && data.feedback.length === 0) {
    return null;
  }

  return {
    filename: `device_${anonymousId.substring(0, 8)}.csv`,
    metrics_csv: toCsv(data.metrics, [
      "metric_id",
      "anonymous_id",
      "network_type",
      "operator_name",
      "signal_strength_dbm",
      "download_mbps",
      "upload_mbps",
      "latency_ms",
      "jitter_ms",
      "packet_loss_pct",
      "recorded_at",
    ]),
    locations_csv: toCsv(data.locations, [
      "location_id",
      "anonymous_id",
      "latitude",
      "longitude",
      "location_name",
      "recorded_at",
    ]),
    feedback_csv: toCsv(data.feedback, [
      "feedback_id",
      "anonymous_id",
      "metric_id",
      "overall_rating",
      "speed_rating",
      "delay_rating",
      "reliability_rating",
      "comment",
      "recorded_at",
    ]),
  };
};

// ──────────────────────────────────────────────
// 8. Export all devices for an operator as CSV (bulk)
// ──────────────────────────────────────────────
const exportAllForOperatorAsCsv = async (operatorName) => {
  const deviceIds = await getAllDeviceIdsForOperator(operatorName);
  const allMetrics = [];
  const allLocations = [];
  const allFeedback = [];

  for (const deviceId of deviceIds) {
    const data = await getDeviceExportData(deviceId, operatorName);
    allMetrics.push(...data.metrics);
    allLocations.push(...data.locations);
    allFeedback.push(...data.feedback);
  }

  return {
    filename: `operator_${operatorName.replace(/\s+/g, "_")}_export.csv`,
    metrics_csv: toCsv(allMetrics, [
      "metric_id",
      "anonymous_id",
      "network_type",
      "operator_name",
      "signal_strength_dbm",
      "download_mbps",
      "upload_mbps",
      "latency_ms",
      "jitter_ms",
      "packet_loss_pct",
      "recorded_at",
    ]),
    locations_csv: toCsv(allLocations, [
      "location_id",
      "anonymous_id",
      "latitude",
      "longitude",
      "location_name",
      "recorded_at",
    ]),
    feedback_csv: toCsv(allFeedback, [
      "feedback_id",
      "anonymous_id",
      "metric_id",
      "overall_rating",
      "speed_rating",
      "delay_rating",
      "reliability_rating",
      "comment",
      "recorded_at",
    ]),
  };
};

// ──────────────────────────────────────────────
// 9. Generate weekly export files (saved to disk)
// ──────────────────────────────────────────────
const EXPORTS_DIR = path.join(__dirname, "../../exports");

const ensureExportsDir = () => {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
};

const generateWeeklyExportFiles = async () => {
  ensureExportsDir();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const operatorConfig = JSON.parse(process.env.OPERATOR_API_KEYS || "{}");
  const operatorNames = Object.keys(operatorConfig);

  const summary = [];

  for (const operatorName of operatorNames) {
    const deviceIds = await getAllDeviceIdsForOperator(operatorName);
    if (deviceIds.length === 0) continue;

    const operatorDir = path.join(EXPORTS_DIR, operatorName.replace(/\s+/g, "_"), today);
    fs.mkdirSync(operatorDir, { recursive: true });

    let totalMetrics = 0;
    let totalLocations = 0;
    let totalFeedback = 0;
    const allMetrics = [];
    const allLocations = [];
    const allFeedback = [];

    for (const deviceId of deviceIds) {
      const data = await getDeviceExportData(deviceId, operatorName);

      if (data.metrics.length > 0 || data.locations.length > 0 || data.feedback.length > 0) {
        const jsonExport = buildJsonExport(deviceId, operatorName, data);
        const jsonPath = path.join(operatorDir, `${deviceId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonExport, null, 2));
        totalMetrics += data.metrics.length;
        totalLocations += data.locations.length;
        totalFeedback += data.feedback.length;
        allMetrics.push(...data.metrics);
        allLocations.push(...data.locations);
        allFeedback.push(...data.feedback);
      }
    }

    const combinedCsvPath = path.join(operatorDir, `${operatorName.replace(/\s+/g, "_")}_combined.csv`);
    const combinedCsv = [
      "=== NETWORK METRICS ===",
      toCsv(allMetrics, [
        "metric_id",
        "anonymous_id",
        "network_type",
        "operator_name",
        "signal_strength_dbm",
        "download_mbps",
        "upload_mbps",
        "latency_ms",
        "jitter_ms",
        "packet_loss_pct",
        "recorded_at",
      ]),
      "=== LOCATIONS ===",
      toCsv(allLocations, [
        "location_id",
        "anonymous_id",
        "latitude",
        "longitude",
        "location_name",
        "recorded_at",
      ]),
      "=== FEEDBACK ===",
      toCsv(allFeedback, [
        "feedback_id",
        "anonymous_id",
        "metric_id",
        "overall_rating",
        "speed_rating",
        "delay_rating",
        "reliability_rating",
        "comment",
        "recorded_at",
      ]),
    ].join("\n");

    fs.writeFileSync(combinedCsvPath, combinedCsv);

    summary.push({
      operator: operatorName,
      devices: deviceIds.length,
      total_metrics: totalMetrics,
      total_locations: totalLocations,
      total_feedback: totalFeedback,
      output_dir: operatorDir,
    });
  }

  return summary;
};

module.exports = {
  exportDeviceAsJson,
  exportAllForOperatorAsJson,
  exportDeviceAsCsv,
  exportAllForOperatorAsCsv,
  generateWeeklyExportFiles,
  getAllDeviceIdsForOperator,
};