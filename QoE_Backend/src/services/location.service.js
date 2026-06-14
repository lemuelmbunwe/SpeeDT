const { pool } = require("../config/db");

const trackLocation = async ({
  anonymous_id,
  latitude,
  longitude,
  location_name,
}) => {
  const result = await pool.query(
    `INSERT INTO location (
      anonymous_id,
      latitude,
      longitude,
      location_name
    ) VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [anonymous_id, latitude, longitude, location_name]
  );
  return result.rows[0];
};

const getLocationHistory = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT * FROM location WHERE anonymous_id = $1 ORDER BY recorded_at DESC`,
    [anonymous_id]
  );
  return result.rows;
};

module.exports = {
  trackLocation,
  getLocationHistory,
};
