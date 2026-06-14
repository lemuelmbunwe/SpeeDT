const { pool } = require("../config/db");

const submitFeedback = async ({
  anonymous_id,
  metric_id,
  overall_rating,
  speed_rating,
  delay_rating,
  reliability_rating,
  comment,
}) => {
  const result = await pool.query(
    `INSERT INTO feedback (
      anonymous_id,
      metric_id,
      overall_rating,
      speed_rating,
      delay_rating,
      reliability_rating,
      comment
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      anonymous_id,
      metric_id,
      overall_rating,
      speed_rating,
      delay_rating,
      reliability_rating,
      comment,
    ]
  );
  return result.rows[0];
};

module.exports = {
  submitFeedback,
};
