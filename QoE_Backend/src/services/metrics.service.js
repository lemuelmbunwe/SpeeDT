const { pool } = require("../config/db");

const ingestMetric = async ({
  anonymous_id,
  network_type,
  operator_name,
  signal_strength_dbm,
  download_mbps,
  upload_mbps,
  latency_ms,
  jitter_ms,
  packet_loss_pct,
}) => {
  const query = `
    INSERT INTO network_metric (
      anonymous_id,
      network_type,
      operator_name,
      signal_strength_dbm,
      download_mbps,
      upload_mbps,
      latency_ms,
      jitter_ms,
      packet_loss_pct
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    anonymous_id,
    network_type,
    operator_name,
    signal_strength_dbm,
    download_mbps,
    upload_mbps,
    latency_ms,
    jitter_ms,
    packet_loss_pct,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const normalizeBatchPayload = (payload) => {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      throw new Error("Batch payload must include at least one metric");
    }
    return payload;
  }

  if (payload && Array.isArray(payload.metrics)) {
    if (payload.metrics.length === 0) {
      throw new Error("Batch payload must include at least one metric");
    }
    return payload.metrics;
  }

  throw new Error("Batch payload must be an array or an object with a metrics array");
};

const ingestMetricsBatch = async (payload) => {
  const metrics = normalizeBatchPayload(payload);
  const insertedMetrics = [];

  for (const metric of metrics) {
    insertedMetrics.push(await ingestMetric(metric));
  }

  return insertedMetrics;
};

const getLatestMetricByDevice = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT * FROM network_metric WHERE anonymous_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
    [anonymous_id]
  );
  return result.rows[0];
};

const getAverageSpeedByDevice = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT
      AVG(download_mbps)::numeric(10,2) AS average_download_mbps,
      AVG(upload_mbps)::numeric(10,2) AS average_upload_mbps
    FROM network_metric
    WHERE anonymous_id = $1`,
    [anonymous_id]
  );
  return result.rows[0];
};

const getMetricHistory = async (anonymous_id, limit, offset) => {
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL`,
    [anonymous_id]
  );

  const dataResult = await pool.query(
    `SELECT * FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL ORDER BY recorded_at DESC LIMIT $2 OFFSET $3`,
    [anonymous_id, limit, offset]
  );

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

module.exports = {
  ingestMetric,
  ingestMetricsBatch,
  normalizeBatchPayload,
  getLatestMetricByDevice,
  getAverageSpeedByDevice,
  getMetricHistory,
};
