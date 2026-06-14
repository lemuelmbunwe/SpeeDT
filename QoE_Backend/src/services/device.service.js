const { pool } = require("../config/db");

const registerDevice = async ({
  device_model,
  os,
  app_version,
  consent_given = false,
  data_collection_enabled = true,
  wifi_only_uploads = false,
  notifications_enabled = false,
}) => {
  const query = `
    INSERT INTO subscriber_device (
      device_model,
      os,
      app_version,
      consent_given,
      data_collection_enabled,
      wifi_only_uploads,
      notifications_enabled
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    device_model,
    os,
    app_version,
    consent_given,
    data_collection_enabled,
    wifi_only_uploads,
    notifications_enabled,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const getDeviceById = async (anonymous_id) => {
  const result = await pool.query(
    `SELECT * FROM subscriber_device WHERE anonymous_id = $1`,
    [anonymous_id]
  );
  return result.rows[0];
};

module.exports = {
  registerDevice,
  getDeviceById,
};
