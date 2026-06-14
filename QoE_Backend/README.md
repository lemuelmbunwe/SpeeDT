# QoE Backend

This is the Node.js + Express backend for the QoE Monitoring System.

## Run the server

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm run dev
```

3. The app uses port from `.env`, default is `5050`.

## REST API Endpoints

### Device registration
POST `/api/devices`

Request body:

```json
{
  "device_model": "Samsung S22",
  "os": "Android 15",
  "app_version": "1.0",
  "consent_given": true
}
```

### Metrics ingestion
POST `/api/metrics`

Request body:

```json
{
  "anonymous_id": "<device-id>",
  "network_type": "4G LTE",
  "operator_name": "MTN",
  "signal_strength_dbm": -75,
  "download_mbps": 34.5,
  "upload_mbps": 12.1,
  "latency_ms": 23.8,
  "jitter_ms": 4.2,
  "packet_loss_pct": 0.0
}
```

### Location tracking
POST `/api/locations`

Request body:

```json
{
  "anonymous_id": "<device-id>",
  "latitude": 5.123456,
  "longitude": 9.123456,
  "location_name": "Buea Highway"
}
```

### Feedback submission
POST `/api/feedback`

Request body:

```json
{
  "anonymous_id": "<device-id>",
  "metric_id": null,
  "overall_rating": 4,
  "speed_rating": 4,
  "delay_rating": 3,
  "reliability_rating": 5,
  "comment": "Good coverage and stable speed"
}
```

### Analytics endpoints
GET `/api/analytics/average-speed/<device-id>`

GET `/api/analytics/average-qoe/<device-id>`

GET `/api/analytics/latest-metric/<device-id>`

## Notes

- The device registration endpoint is `POST /api/devices`, not `/api/devices/register`.
- Always set `Content-Type: application/json` for POST requests.
- Use the `anonymous_id` returned from device registration in later requests.
