-- ============================================================================
-- QoE Monitoring System — Database Schema
-- Target: PostgreSQL (pgAdmin local) → Compatible with Neon / Supabase
-- ============================================================================

-- 0. DROP EXISTING TABLES (if re-running the script)
-- Order matters due to foreign key constraints
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS network_metric CASCADE;
DROP TABLE IF EXISTS subscriber_device CASCADE;

-- ============================================================================
-- 1. subscriber_device
-- Anonymized device identity. One row per unique device.
-- ============================================================================
CREATE TABLE subscriber_device (
    anonymous_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    device_model        VARCHAR(100)    NOT NULL,
    os                  VARCHAR(50)     NOT NULL,
    app_version         VARCHAR(20)     NOT NULL,
    consent_given       BOOLEAN         NOT NULL DEFAULT FALSE,
    data_collection_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    wifi_only_uploads   BOOLEAN         NOT NULL DEFAULT FALSE,
    notifications_enabled BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index: find devices by consent status (for admin queries)
CREATE INDEX idx_subscriber_device_consent
    ON subscriber_device (consent_given);

COMMENT ON TABLE subscriber_device IS 'Anonymized device identity for crowdsensing';
COMMENT ON COLUMN subscriber_device.anonymous_id IS 'Unique anonymous identifier for each device';
COMMENT ON COLUMN subscriber_device.consent_given IS 'Has the user agreed to data collection on the Consent screen';
COMMENT ON COLUMN subscriber_device.data_collection_enabled IS 'Settings toggle: allow background sensing';
COMMENT ON COLUMN subscriber_device.wifi_only_uploads IS 'Settings toggle: only upload over Wi-Fi';
COMMENT ON COLUMN subscriber_device.notifications_enabled IS 'Settings toggle: network anomaly alerts';

-- ============================================================================
-- 2. network_metric
-- Stores speed test results AND periodic network status snapshots.
-- One device → many metrics.
-- ============================================================================
CREATE TABLE network_metric (
    metric_id           BIGSERIAL       PRIMARY KEY,
    anonymous_id        UUID            NOT NULL,
    network_type        VARCHAR(30),                                  -- e.g. "5G NSA", "4G LTE", "Wi-Fi"
    operator_name       VARCHAR(50),                                  -- e.g. "MTN", "Orange", "Starlink"
    signal_strength_dbm INTEGER,                                      -- e.g. -85 (dBm)
    download_mbps       DECIMAL(8,2),                                 -- NULL if only a network snapshot
    upload_mbps         DECIMAL(8,2),                                 -- NULL if only a network snapshot
    latency_ms          DECIMAL(6,2),                                 -- Ping
    jitter_ms           DECIMAL(5,2),                                 -- Jitter
    packet_loss_pct     DECIMAL(4,2),                                 -- Packet loss percentage
    recorded_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_network_metric_device
        FOREIGN KEY (anonymous_id)
        REFERENCES subscriber_device (anonymous_id)
        ON DELETE CASCADE
);

-- Index: fetch metrics for a specific device (most common query)
CREATE INDEX idx_network_metric_device
    ON network_metric (anonymous_id, recorded_at DESC);


COMMENT ON TABLE network_metric IS 'Speed test results and periodic network status snapshots';
COMMENT ON COLUMN network_metric.download_mbps IS 'Download speed in Mbps. NULL if this row is a passive status snapshot';
COMMENT ON COLUMN network_metric.upload_mbps IS 'Upload speed in Mbps. NULL if this row is a passive status snapshot';
COMMENT ON COLUMN network_metric.signal_strength_dbm IS 'Signal strength in dBm. Negative values. Higher (closer to 0) is better';

-- ============================================================================
-- 3. location
-- GPS coordinates tied to a device at a specific point in time.
-- One device → many locations.
-- ============================================================================
CREATE TABLE location (
    location_id         BIGSERIAL       PRIMARY KEY,
    anonymous_id        UUID            NOT NULL,
    latitude            DECIMAL(9,6)    NOT NULL,
    longitude           DECIMAL(9,6)    NOT NULL,
    location_name       VARCHAR(100),                                  -- e.g. "Molyko", "Buea Highway" (reverse-geocoded or manual)
    recorded_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_location_device
        FOREIGN KEY (anonymous_id)
        REFERENCES subscriber_device (anonymous_id)
        ON DELETE CASCADE
);

-- Index: get location history for a device
CREATE INDEX idx_location_device
    ON location (anonymous_id, recorded_at DESC);

-- Index: spatial queries (coverage mapping)
CREATE INDEX idx_location_coordinates
    ON location (latitude, longitude);

COMMENT ON TABLE location IS 'GPS coordinates for coverage mapping and location-aware speed results';

-- ============================================================================
-- 4. feedback
-- Subjective QoE ratings from users. Optionally linked to a specific metric.
-- One device → many feedback records.
-- ============================================================================
CREATE TABLE feedback (
    feedback_id         BIGSERIAL       PRIMARY KEY,
    anonymous_id        UUID            NOT NULL,
    metric_id           BIGINT,                                       -- NULL if feedback is standalone
    overall_rating      SMALLINT        NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    speed_rating        SMALLINT        NOT NULL CHECK (speed_rating BETWEEN 1 AND 5),
    delay_rating        SMALLINT        NOT NULL CHECK (delay_rating BETWEEN 1 AND 5),
    reliability_rating  SMALLINT        NOT NULL CHECK (reliability_rating BETWEEN 1 AND 5),
    comment             TEXT,
    recorded_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_feedback_device
        FOREIGN KEY (anonymous_id)
        REFERENCES subscriber_device (anonymous_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_feedback_metric
        FOREIGN KEY (metric_id)
        REFERENCES network_metric (metric_id)
        ON DELETE SET NULL
);

-- Index: fetch feedback for a device
CREATE INDEX idx_feedback_device
    ON feedback (anonymous_id, recorded_at DESC);

-- Index: aggregate ratings
CREATE INDEX idx_feedback_ratings
    ON feedback (overall_rating, speed_rating, delay_rating, reliability_rating);

COMMENT ON TABLE feedback IS 'User-submitted QoE ratings and comments';
COMMENT ON COLUMN feedback.metric_id IS 'Optional link to a specific speed test. NULL if feedback is standalone';

-- ============================================================================
-- FINAL VERIFICATION QUERY
-- Run this after creating all tables to confirm everything is in order.
-- ============================================================================
