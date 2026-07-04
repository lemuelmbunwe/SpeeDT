INSERT INTO subscriber_device (
  anonymous_id,
  device_model,
  os,
  app_version,
  consent_given,
  data_collection_enabled,
  wifi_only_uploads,
  notifications_enabled
) VALUES
  ('11111111-1111-4111-8111-111111111111', 'iPhone 15 Pro', 'iOS 18.2', '1.0.0', TRUE, TRUE, FALSE, FALSE),
  ('22222222-2222-4222-8222-222222222222', 'Samsung Galaxy S24', 'Android 15.0', '1.0.0', TRUE, TRUE, TRUE, FALSE)
ON CONFLICT (anonymous_id) DO NOTHING;

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
) VALUES
  ('11111111-1111-4111-8111-111111111111', '5G', 'MTN Cameroon', -65, 142.00, 48.20, 12.00, 2.50, 0.00, NOW() - INTERVAL '2 minutes'),
  ('11111111-1111-4111-8111-111111111111', '4G LTE', 'MTN Cameroon', -72, 138.00, 42.10, 16.00, 3.20, 0.20, NOW() - INTERVAL '2 hours'),
  ('11111111-1111-4111-8111-111111111111', 'Wi-Fi', 'MTN Cameroon', -55, 95.00, 39.20, 18.00, 4.10, 0.10, NOW() - INTERVAL '2 days'),
  ('22222222-2222-4222-8222-222222222222', '5G', 'Orange Cameroon', -68, 150.50, 45.20, 22.00, 4.00, 0.00, NOW() - INTERVAL '1 hour'),
  ('22222222-2222-4222-8222-222222222222', '4G LTE', 'Orange Cameroon', -74, 85.40, 24.50, 30.00, 5.10, 0.50, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

INSERT INTO location (
  anonymous_id,
  latitude,
  longitude,
  location_name,
  recorded_at
) VALUES
  ('11111111-1111-4111-8111-111111111111', 4.1596, 9.2880, 'Downtown Core', NOW() - INTERVAL '30 minutes'),
  ('22222222-2222-4222-8222-222222222222', 4.0508, 9.6990, 'Douala Centre', NOW() - INTERVAL '45 minutes')
ON CONFLICT DO NOTHING;
