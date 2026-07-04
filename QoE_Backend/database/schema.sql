CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS subscriber_device (
  anonymous_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_model VARCHAR(100) NOT NULL,
  os VARCHAR(50) NOT NULL,
  app_version VARCHAR(20) NOT NULL,
  consent_given BOOLEAN DEFAULT FALSE,
  data_collection_enabled BOOLEAN DEFAULT TRUE,
  wifi_only_uploads BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriber_device_consent
  ON subscriber_device (consent_given);

CREATE TABLE IF NOT EXISTS network_metric (
  metric_id BIGSERIAL PRIMARY KEY,
  anonymous_id UUID NOT NULL REFERENCES subscriber_device(anonymous_id) ON DELETE CASCADE,
  network_type VARCHAR(30),
  operator_name VARCHAR(50),
  signal_strength_dbm INTEGER,
  download_mbps DECIMAL(8,2),
  upload_mbps DECIMAL(8,2),
  latency_ms DECIMAL(6,2),
  jitter_ms DECIMAL(5,2),
  packet_loss_pct DECIMAL(4,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_metric_device
  ON network_metric (anonymous_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_metric_trend
  ON network_metric (anonymous_id, recorded_at);

CREATE TABLE IF NOT EXISTS location (
  location_id BIGSERIAL PRIMARY KEY,
  anonymous_id UUID NOT NULL REFERENCES subscriber_device(anonymous_id) ON DELETE CASCADE,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  location_name VARCHAR(100),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_device
  ON location (anonymous_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_coordinates
  ON location (latitude, longitude);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id BIGSERIAL PRIMARY KEY,
  anonymous_id UUID NOT NULL REFERENCES subscriber_device(anonymous_id) ON DELETE CASCADE,
  metric_id BIGINT REFERENCES network_metric(metric_id) ON DELETE SET NULL,
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  speed_rating SMALLINT CHECK (speed_rating BETWEEN 1 AND 5),
  delay_rating SMALLINT CHECK (delay_rating BETWEEN 1 AND 5),
  reliability_rating SMALLINT CHECK (reliability_rating BETWEEN 1 AND 5),
  comment TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_device
  ON feedback (anonymous_id, recorded_at DESC);
