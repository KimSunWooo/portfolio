import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL;
const requestPath = __ENV.REQUEST_PATH || '/api/products';
const sleepSeconds = Number(__ENV.SLEEP_SECONDS || '0.5');
const expectedCount = __ENV.EXPECTED_COUNT;
const summaryPath = __ENV.SUMMARY_PATH;

if (!baseUrl || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(baseUrl)) {
  throw new Error('BASE_URL must be http://127.0.0.1 or http://localhost with an optional port');
}

export const options = {
  vus: Number(__ENV.VUS || '10'),
  duration: __ENV.DURATION || '30s',
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(50)', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}${requestPath}`, { timeout: '10s' });
  check(response, {
    'status 200': (result) => result.status === 200,
    'expected json array': (result) => {
      let body;
      try {
        body = result.json();
      } catch (error) {
        return false;
      }
      if (!Array.isArray(body)) {
        return false;
      }
      if (expectedCount && body.length !== Number(expectedCount)) {
        return false;
      }
      return true;
    },
  });
  sleep(sleepSeconds);
}

export function handleSummary(data) {
  const summary = JSON.stringify(data);
  if (!summaryPath) {
    return { stdout: summary };
  }
  return { [summaryPath]: summary };
}
