-- Latest metric
SELECT * FROM network_metric WHERE anonymous_id = $1 ORDER BY recorded_at DESC LIMIT 1;

-- Average speed
SELECT AVG(download_mbps)::numeric(10,2) AS average_download_mbps,
       AVG(upload_mbps)::numeric(10,2) AS average_upload_mbps
FROM network_metric WHERE anonymous_id = $1;

-- History
SELECT COUNT(*) FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL;
SELECT * FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL ORDER BY recorded_at DESC LIMIT $2 OFFSET $3;

-- Trend
SELECT (recorded_at::date) AS day,
       ROUND(AVG(download_mbps)::numeric, 1) AS avg_download,
       ROUND(AVG(signal_strength_dbm)::numeric, 1) AS avg_signal
FROM network_metric
WHERE anonymous_id = $1 AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
GROUP BY (recorded_at::date) ORDER BY day ASC;

-- Device preferences
SELECT consent_given, data_collection_enabled, wifi_only_uploads, notifications_enabled
FROM subscriber_device WHERE anonymous_id = $1;

-- Update preferences
UPDATE subscriber_device SET
  data_collection_enabled = COALESCE($2, data_collection_enabled),
  wifi_only_uploads = COALESCE($3, wifi_only_uploads),
  notifications_enabled = COALESCE($4, notifications_enabled)
WHERE anonymous_id = $1 RETURNING *;
