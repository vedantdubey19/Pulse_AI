/**
 * Statistical anomaly detection on mock data streams.
 */

let anomalyId = 0;

const ANOMALY_TYPES = [
  {
    type: 'latency_spike',
    title: 'Latency Spike Detected',
    endpoints: ['/api/orders/checkout', '/api/payments/process', '/api/auth/verify'],
    descriptions: [
      'P95 latency exceeded 3x baseline in the last 2 minutes',
      'Response time degradation detected — 95th percentile shifted from 200ms to 2800ms',
      'Sustained latency increase across 4 consecutive measurement windows'
    ]
  },
  {
    type: 'error_surge',
    title: 'Error Rate Surge',
    endpoints: ['/api/orders/checkout', '/api/payments/process', '/api/webhooks/stripe'],
    descriptions: [
      'Error rate jumped from 1.2% to 28.4% — 5xx responses dominating',
      'Cascading 500 errors detected across dependent endpoints',
      'Error rate 4.7σ above rolling 30-minute average'
    ]
  },
  {
    type: 'traffic_anomaly',
    title: 'Traffic Anomaly',
    endpoints: ['/api/products/search', '/api/auth/verify', '/api/users/profile'],
    descriptions: [
      'Request volume dropped 60% — possible upstream routing failure',
      'Unusual traffic pattern: 3x normal volume with 0% error rate',
      'Traffic distribution shifted — 80% of requests hitting a single endpoint'
    ]
  }
];

/**
 * Generate a random anomaly.
 * @returns {object}
 */
export function generateAnomaly() {
  const type = ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)];
  const endpoint = type.endpoints[Math.floor(Math.random() * type.endpoints.length)];
  const description = type.descriptions[Math.floor(Math.random() * type.descriptions.length)];
  const score = Math.floor(40 + Math.random() * 55); // 40-95

  anomalyId++;

  return {
    id: anomalyId,
    type: type.type,
    title: type.title,
    endpoint,
    description,
    score,
    severity: score > 70 ? 'high' : 'medium',
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    deviation: `+${(1.5 + Math.random() * 4).toFixed(1)}σ`,
    sparkData: generateSparklineData(type.type)
  };
}

/**
 * Generate sparkline data points showing deviation.
 * @param {string} type
 * @returns {number[]}
 */
function generateSparklineData(type) {
  const points = [];
  const baseline = type === 'latency_spike' ? 200 : type === 'error_surge' ? 2 : 5000;

  for (let i = 0; i < 12; i++) {
    if (i < 7) {
      points.push(baseline + (Math.random() - 0.5) * baseline * 0.2);
    } else {
      const spike = type === 'latency_spike' ? baseline * (2 + Math.random() * 3) :
                     type === 'error_surge' ? baseline * (5 + Math.random() * 10) :
                     baseline * (0.2 + Math.random() * 0.3);
      points.push(spike);
    }
  }
  return points;
}

/**
 * Start the anomaly detection loop.
 * @param {(anomaly: object) => void} onAnomaly - Callback when anomaly detected
 * @returns {() => void} Stop function
 */
export function startAnomalyDetection(onAnomaly) {
  const scheduleNext = () => {
    const delay = 8000 + Math.random() * 7000; // 8-15s
    return setTimeout(() => {
      const anomaly = generateAnomaly();
      onAnomaly(anomaly);
      timerId = scheduleNext();
    }, delay);
  };

  let timerId = scheduleNext();

  return () => clearTimeout(timerId);
}
