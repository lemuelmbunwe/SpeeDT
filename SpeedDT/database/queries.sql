-- ============================================================================
-- QoE Monitoring System — Application Queries
-- These are the exact SQL queries each screen needs.
-- Use these as reference when building the backend API endpoints.
-- ============================================================================

-- ============================================================================
-- HOMESCREEN QUERIES
-- ============================================================================

-- 1.1 Current network status (latest metric for the device)
-- Returns: download, upload, ping, signal strength, network type, operator
SELECT
    download_mbps,
    upload_mbps,
    latency_ms,
    signal_strength_dbm,
    network_type,
    operator_name,
    recorded_at
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND download_mbps IS NOT NULL
ORDER BY recorded_at DESC
LIMIT 1;

-- 1.2 Recent tests (last 3 speed tests, excluding the current one)
SELECT
    metric_id,
    download_mbps,
    upload_mbps,
    latency_ms,
    recorded_at
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND download_mbps IS NOT NULL
ORDER BY recorded_at DESC
LIMIT 3 OFFSET 1;

-- 1.3 Reliability score (percentage of tests with latency < 50ms)
SELECT
    ROUND(
        (COUNT(*) FILTER (WHERE latency_ms < 50)::DECIMAL / COUNT(*)) * 100
    ) AS reliability_score
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND latency_ms IS NOT NULL;

-- 1.4 Current signal strength (latest passive snapshot)
SELECT
    signal_strength_dbm,
    network_type,
    operator_name,
    recorded_at
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND download_mbps IS NULL
ORDER BY recorded_at DESC
LIMIT 1;

-- ============================================================================
-- TEST SCREEN QUERIES
-- ============================================================================

-- 2.1 Save a new speed test result
-- (This is an INSERT, run after the speed test completes)
INSERT INTO network_metric (
    anonymous_id,
    network_type,
    operator_name,
    signal_strength_dbm,
    download_mbps,
    upload_mbps,
    latency_ms,
    jitter_ms,
    packet_loss_pct,
    recorded_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- anonymous_id
    '5G Ultra Wideband',                      -- network_type
    'MTN Cameroon',                           -- operator_name
    -65,                                      -- signal_strength_dbm
    150.50,                                   -- download_mbps
    45.20,                                    -- upload_mbps
    22.00,                                    -- latency_ms
    4.00,                                     -- jitter_ms
    0.10                                      -- packet_loss_pct
)
RETURNING metric_id;

-- 2.2 Get connection info for the test screen display
-- (Latest network snapshot with non-null operator)
SELECT DISTINCT ON (anonymous_id)
    network_type,
    operator_name,
    signal_strength_dbm,
    recorded_at
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND operator_name IS NOT NULL
ORDER BY anonymous_id, recorded_at DESC;

-- ============================================================================
-- HISTORY SCREEN QUERIES
-- ============================================================================

-- 3.1 Summary stats: average download and peak recorded
SELECT
    ROUND(AVG(download_mbps), 1) AS avg_download,
    ROUND(MAX(download_mbps), 1) AS peak_recorded
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND download_mbps IS NOT NULL;

-- 3.2 Trend data: daily average download speed for the last 7 days
SELECT
    (recorded_at::date) AS day,
    ROUND(AVG(download_mbps), 1) AS avg_download,
    ROUND(AVG(signal_strength_dbm), 1) AS avg_signal
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND recorded_at >= NOW() - INTERVAL '7 days'
GROUP BY (recorded_at::date)
ORDER BY day ASC;

-- 3.3 Recent records (paginated history list)
SELECT
    nm.metric_id,
    nm.download_mbps,
    nm.upload_mbps,
    nm.latency_ms,
    nm.network_type,
    nm.operator_name,
    nm.recorded_at,
    l.location_name
FROM network_metric nm
LEFT JOIN location l ON l.anonymous_id = nm.anonymous_id
    AND l.recorded_at::date = nm.recorded_at::date
WHERE nm.anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY nm.recorded_at DESC
LIMIT 20 OFFSET 0;

-- 3.4 Count total records (for pagination)
SELECT COUNT(*) AS total_records
FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND download_mbps IS NOT NULL;

-- ============================================================================
-- SETTINGS SCREEN QUERIES
-- ============================================================================

-- 4.1 Load current user preferences
SELECT
    consent_given,
    data_collection_enabled,
    wifi_only_uploads,
    notifications_enabled,
    device_model,
    os,
    app_version
FROM subscriber_device
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- 4.2 Update preferences (individual toggles)
UPDATE subscriber_device
SET
    data_collection_enabled = TRUE,
    wifi_only_uploads = TRUE,
    notifications_enabled = FALSE
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================================================
-- CONSENT SCREEN QUERIES
-- ============================================================================

-- 5.1 Register a new device (first launch)
INSERT INTO subscriber_device (
    device_model,
    os,
    app_version,
    consent_given
) VALUES (
    'iPhone 15 Pro',
    'iOS 18.2',
    '1.0.0',
    FALSE
)
RETURNING anonymous_id;

-- 5.2 Grant consent (after user taps "I AGREE & CONTINUE")
UPDATE subscriber_device
SET consent_given = TRUE
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- 5.3 Check if device has already consented (for re-launch detection)
SELECT
    anonymous_id,
    consent_given
FROM subscriber_device
WHERE anonymous_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================================================
-- FEEDBACK QUERIES
-- ============================================================================

-- 6.1 Submit feedback (linked to a speed test)
INSERT INTO feedback (
    anonymous_id,
    metric_id,
    overall_rating,
    speed_rating,
    delay_rating,
    reliability_rating,
    comment
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    1,        -- metric_id (optional, can be NULL)
    4,        -- overall_rating
    4,        -- speed_rating
    3,        -- delay_rating
    4,        -- reliability_rating
    'Good connection overall'
);

-- 6.2 Submit standalone feedback (not linked to a test)
INSERT INTO feedback (
    anonymous_id,
    overall_rating,
    speed_rating,
    delay_rating,
    reliability_rating,
    comment
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    3, 3, 3, 3,
    'Average experience today'
);

-- ============================================================================
-- ADMIN / ANALYTICS QUERIES
-- ============================================================================

-- 7.1 Coverage map data (all locations with signal strength)
SELECT
    l.latitude,
    l.longitude,
    l.location_name,
    nm.signal_strength_dbm,
    nm.network_type,
    nm.operator_name,
    nm.download_mbps,
    l.recorded_at
FROM location l
JOIN network_metric nm ON nm.anonymous_id = l.anonymous_id
    AND nm.recorded_at::date = l.recorded_at::date
ORDER BY l.recorded_at DESC;

-- 7.2 Average ratings per location
SELECT
    l.location_name,
    ROUND(AVG(f.overall_rating), 1) AS avg_overall,
    ROUND(AVG(f.speed_rating), 1) AS avg_speed,
    ROUND(AVG(f.delay_rating), 1) AS avg_delay,
    ROUND(AVG(f.reliability_rating), 1) AS avg_reliability,
    COUNT(*) AS feedback_count
FROM feedback f
JOIN location l ON l.anonymous_id = f.anonymous_id
    AND l.recorded_at::date = f.recorded_at::date
GROUP BY l.location_name
ORDER BY avg_overall DESC;

-- 7.3 Operator performance comparison
SELECT
    operator_name,
    COUNT(*) AS test_count,
    ROUND(AVG(download_mbps), 1) AS avg_download,
    ROUND(AVG(upload_mbps), 1) AS avg_upload,
    ROUND(AVG(latency_ms), 1) AS avg_latency
FROM network_metric
WHERE operator_name IS NOT NULL
  AND download_mbps IS NOT NULL
GROUP BY operator_name
ORDER BY avg_download DESC;