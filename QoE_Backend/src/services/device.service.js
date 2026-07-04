const { pool } = require("../config/db");

const normalizeText = (value, maxLength) => {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const registerDevice = async ({
  device_model,
  os,
  app_version,
  consent_given = false,
  data_collection_enabled = true,
  wifi_only_uploads = false,
  notifications_enabled = false,
}) => {
  const normalizedDeviceModel = normalizeText(device_model, 100) || "Unknown Device";
  const normalizedOs = normalizeText(os, 50) || "Unknown OS";
  const normalizedAppVersion = normalizeText(app_version, 20) || "0.0.0";
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
    normalizedDeviceModel,
    normalizedOs,
    normalizedAppVersion,
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

const updateDevicePreferences = async (
  anonymous_id,
  { data_collection_enabled, wifi_only_uploads, notifications_enabled }
) => {
  const result = await pool.query(
    `UPDATE subscriber_device SET
      data_collection_enabled = COALESCE($2, data_collection_enabled),
      wifi_only_uploads = COALESCE($3, wifi_only_uploads),
      notifications_enabled = COALESCE($4, notifications_enabled)
     WHERE anonymous_id = $1 RETURNING *`,
    [anonymous_id, data_collection_enabled, wifi_only_uploads, notifications_enabled]
  );
  return result.rows[0];
};

const deleteDeviceData = async (anonymous_id) => {
  await pool.query("DELETE FROM feedback WHERE anonymous_id = $1", [anonymous_id]);
  await pool.query("DELETE FROM location WHERE anonymous_id = $1", [anonymous_id]);
  await pool.query("DELETE FROM network_metric WHERE anonymous_id = $1", [anonymous_id]);
  await pool.query("UPDATE subscriber_device SET consent_given = false WHERE anonymous_id = $1", [anonymous_id]);
};

module.exports = {
  registerDevice,
  getDeviceById,
  updateDevicePreferences,
  deleteDeviceData,
};
