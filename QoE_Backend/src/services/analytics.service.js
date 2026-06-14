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

module.exports = {
  getAverageQoEByDevice,
  getLatestMetricByDevice,
};
