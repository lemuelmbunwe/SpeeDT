const { pool } = require("../config/db");

const getAverageQoEByDevice = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT
      AVG(overall_rating)::numeric(4,2) AS average_overall_rating,
      AVG(speed_rating)::numeric(4,2) AS average_speed_rating,
      AVG(delay_rating)::numeric(4,2) AS average_delay_rating,
      AVG(reliability_rating)::numeric(4,2) AS average_reliability_rating
    FROM feedback
    WHERE anonymous_id = $1`,
    [anonymous_id]
  );
  return result.rows[0];
};

const getLatestMetricByDevice = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT * FROM network_metric WHERE anonymous_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
    [anonymous_id]
  );
  return result.rows[0];
};

const getTrendByDevice = async (anonymous_id, days) => {
  const result = await pool.query(
    `SELECT (recorded_at::date) AS day,
            ROUND(AVG(download_mbps)::numeric, 1) AS avg_download,
            ROUND(AVG(signal_strength_dbm)::numeric, 1) AS avg_signal
     FROM network_metric
     WHERE anonymous_id = $1 AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
     GROUP BY (recorded_at::date) ORDER BY day ASC`,
    [anonymous_id, days]
  );
  return result.rows;
};

module.exports = {
  getAverageQoEByDevice,
  getLatestMetricByDevice,
  getTrendByDevice,
};
