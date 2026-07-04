const test = require('node:test');
const assert = require('node:assert/strict');

const metricsService = require('../src/services/metrics.service');

test('normalizeBatchPayload accepts array payloads and object payloads', () => {
  const arrayPayload = [
    {
      anonymous_id: '11111111-1111-4111-8111-111111111111',
      network_type: 'Wi-Fi',
      download_mbps: 120,
    },
  ];

  const objectPayload = {
    metrics: [
      {
        anonymous_id: '11111111-1111-4111-8111-111111111111',
        network_type: '5G',
        download_mbps: 90,
      },
    ],
  };

  assert.deepEqual(metricsService.normalizeBatchPayload(arrayPayload), arrayPayload);
  assert.deepEqual(metricsService.normalizeBatchPayload(objectPayload), objectPayload.metrics);
});

test('normalizeBatchPayload rejects payloads without metrics', () => {
  assert.throws(() => metricsService.normalizeBatchPayload({ foo: 'bar' }), /metrics/i);
});
