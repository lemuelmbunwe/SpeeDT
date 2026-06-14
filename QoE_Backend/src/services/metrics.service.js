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

module.exports = {
  ingestMetric,
  getLatestMetricByDevice,
  getAverageSpeedByDevice,
};
