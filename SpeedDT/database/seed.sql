-- ============================================================================
-- QoE Monitoring System — Seed Data
-- Realistic sample data matching the app's current hardcoded mock values.
-- Run AFTER schema.sql has been executed.
-- ============================================================================

-- ============================================================================
-- 1. subscriber_device — Two example devices
-- ============================================================================
INSERT INTO subscriber_device (anonymous_id, device_model, os, app_version, consent_given, data_collection_enabled, wifi_only_uploads, notifications_enabled)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'iPhone 15 Pro',       'iOS 18.2',     '1.0.0', TRUE,  TRUE,  FALSE, FALSE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Samsung Galaxy S24', 'Android 15.0', '1.0.0', TRUE,  TRUE,  TRUE,  TRUE);

-- ============================================================================
-- 2. network_metric — Speed test results matching all screens' mock values
-- ============================================================================
INSERT INTO network_metric (anonymous_id, network_type, operator_name, signal_strength_dbm, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss_pct, recorded_at)
VALUES
    -- HomeScreen current values (142 down, 48.2 up, 12 ping)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'MTN Cameroon',     -65, 142.00, 48.20, 12.00, 3.50, 0.20, NOW() - INTERVAL '2 minutes'),
    -- HomeScreen recent test: Downtown Core (138 Mbps)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'MTN Cameroon',     -67, 138.00, 45.10, 13.00, 3.80, 0.30, NOW() - INTERVAL '2 hours'),
    -- HomeScreen recent test: Business District (112 Mbps)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'MTN Cameroon',     -72, 112.00, 38.50, 16.00, 4.10, 0.50, NOW() - INTERVAL '1 day'),
    -- HomeScreen recent test: Transit Hub (95 Mbps)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4G LTE',            'MTN Cameroon',     -80,  95.00, 30.20, 22.00, 5.00, 0.80, NOW() - INTERVAL '2 days'),

    -- TestScreen simulated results (150.5 down, 45.2 up, 22 ping, 4 jitter)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'Starlink Network', -60, 150.50, 45.20, 22.00, 4.00, 0.10, NOW() - INTERVAL '1 hour'),

    -- HistoryScreen: Molyko (85.4 Mbps, 5G NSA)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G NSA',            'Orange Cameroon',  -75,  85.40, 28.30, 18.00, 4.50, 0.40, NOW() - INTERVAL '5 hours'),
    -- HistoryScreen: Clerks Quarters (32.1 Mbps, 4G LTE)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4G LTE',            'Orange Cameroon',  -88,  32.10, 12.40, 35.00, 7.20, 1.50, NOW() - INTERVAL '1 day'),
    -- HistoryScreen: Buea Highway — No Service (null speeds, poor signal)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'No Service',        NULL,               -120, NULL,   NULL,  NULL,   NULL,  NULL,  NOW() - INTERVAL '3 days'),

    -- Additional records for averaging (avg ~45.2 Mbps)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4G LTE',            'MTN Cameroon',     -82,  42.50, 15.80, 28.00, 5.50, 0.90, NOW() - INTERVAL '4 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4G LTE',            'MTN Cameroon',     -85,  38.20, 13.60, 32.00, 6.00, 1.20, NOW() - INTERVAL '5 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3G',                'MTN Cameroon',     -95,  18.50,  6.80, 55.00, 9.00, 2.50, NOW() - INTERVAL '6 days'),

    -- Passive network snapshots (null download/upload — just signal monitoring)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'MTN Cameroon',     -63, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '30 minutes'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5G Ultra Wideband', 'MTN Cameroon',     -68, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '45 minutes'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4G LTE',            'MTN Cameroon',     -90, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 hours'),

    -- Device 2: Samsung Galaxy S24 — different operator
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '5G NSA',            'Orange Cameroon',  -70, 120.00, 40.00, 15.00, 3.20, 0.20, NOW() - INTERVAL '1 hour'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '4G LTE',            'Orange Cameroon',  -85,  55.00, 20.00, 25.00, 5.00, 0.60, NOW() - INTERVAL '6 hours'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '4G LTE',            'Orange Cameroon',  -92,  28.00, 10.50, 40.00, 8.00, 1.80, NOW() - INTERVAL '1 day');

-- ============================================================================
-- 3. location — GPS coordinates for coverage mapping
-- ============================================================================
INSERT INTO location (anonymous_id, latitude, longitude, location_name, recorded_at)
VALUES
    -- Device 1 locations
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1500,  9.2333, 'Downtown Core',    NOW() - INTERVAL '2 hours'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1400,  9.2200, 'Business District', NOW() - INTERVAL '1 day'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1600,  9.2500, 'Transit Hub',       NOW() - INTERVAL '2 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1300,  9.2100, 'Molyko',            NOW() - INTERVAL '5 hours'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1200,  9.2000, 'Clerks Quarters',   NOW() - INTERVAL '1 day'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',  4.1700,  9.2600, 'Buea Highway',      NOW() - INTERVAL '3 days'),

    -- Device 2 locations
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',  4.0500,  9.6800, 'Douala Centre',     NOW() - INTERVAL '1 hour'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',  4.0400,  9.6900, 'Bonanjo',           NOW() - INTERVAL '6 hours'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',  4.0600,  9.6700, 'Akwa',              NOW() - INTERVAL '1 day');

-- ============================================================================
-- 4. feedback — User QoE ratings
-- ============================================================================
INSERT INTO feedback (anonymous_id, metric_id, overall_rating, speed_rating, delay_rating, reliability_rating, comment, recorded_at)
VALUES
    -- Feedback linked to specific speed tests
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 5, 5, 4, 5, 'Excellent 5G speeds in downtown area!', NOW() - INTERVAL '2 minutes'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, 4, 4, 4, 4, 'Good performance, consistent connection.', NOW() - INTERVAL '2 hours'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 3, 3, 3, 4, 'Decent but slower during peak hours.', NOW() - INTERVAL '1 day'),

    -- Standalone feedback (not linked to a specific metric)
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 4, 4, 3, 4, 'Overall satisfied with the network coverage.', NOW() - INTERVAL '3 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 2, 2, 2, 3, 'Very poor signal in Buea Highway area.', NOW() - INTERVAL '4 days'),

    -- Device 2 feedback
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 16, 4, 4, 5, 4, 'Orange 5G is fast in Douala Centre.', NOW() - INTERVAL '1 hour'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', NULL, 3, 3, 3, 3, 'Average experience, could be better.', NOW() - INTERVAL '2 days');