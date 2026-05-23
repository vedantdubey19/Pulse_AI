/**
 * Scripted AI chat responses matched by keyword.
 */

const RESPONSES = [
  {
    keywords: ['latest', 'recent', 'incident', 'what happened'],
    response: `**Latest Incident: DB Connection Pool Exhaustion**

🔴 **Severity:** HIGH | **Endpoint:** \`POST /api/orders/checkout\`
⏱️ **Started:** 2 minutes ago | **Affected:** 4,201 requests

The \`/api/orders/checkout\` endpoint is returning 500 errors at a rate of 34%. The root cause has been identified as a database connection pool exhaustion.

**Key metrics:**
• Error rate: 1.2% → 34% (spike at 14:02)
• P95 latency: 200ms → 843ms
• DB pool: active=10, idle=0, waiting=142

I recommend checking the AI RCA page for the full analysis and fix recommendations.`
  },
  {
    keywords: ['latency', 'slow', 'p95', 'p99', 'response time'],
    response: `**Latency Analysis — Last 30 Minutes**

📊 Current P95 latency is **1842ms**, which is above the SLA target of 500ms.

**Breakdown by endpoint:**
| Endpoint | P95 | Status |
|----------|-----|--------|
| \`/api/orders/checkout\` | 843ms | ⚠️ Degraded |
| \`/api/auth/verify\` | 2840ms | 🔴 Slow |
| \`/api/payments/process\` | 1200ms | ⚠️ Degraded |
| \`/api/products/search\` | 120ms | ✅ Healthy |

**Root cause:** The latency spike correlates with the DB connection pool exhaustion. When the pool is full, requests queue and wait up to 30s for a connection.

**Suggestion:** Increase \`DATABASE_POOL_SIZE\` from 10 to 25 and add connection timeout handling.`
  },
  {
    keywords: ['fix', 'suggest', 'recommend', 'solve', 'how to fix'],
    response: `**Recommended Fix for Current Issues**

Here's a prioritized action plan:

**1. Immediate (next 5 min):**
\`\`\`bash
# Increase DB pool size
export DATABASE_POOL_SIZE=25
kubectl rollout restart deployment/checkout-service
\`\`\`

**2. Short-term (next 1 hour):**
• Add connection timeout with exponential backoff:
\`\`\`javascript
const pool = new Pool({
  max: 25,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});
\`\`\`
• Implement circuit breaker for payment validation

**3. Long-term:**
• Add connection pooling metrics to monitoring
• Set up auto-scaling for DB connections based on load
• Consider read replicas for query-heavy endpoints

Would you like me to create a Jira ticket with these recommendations?`
  },
  {
    keywords: ['similar', 'past', 'history', 'before', 'pattern'],
    response: `**Similar Past Incidents**

I found 3 similar incidents in the last 30 days:

**1. May 18 — ElasticSearch Node OOM** (resolved in 45m)
• Also triggered by resource exhaustion
• Affected \`/api/products/search\` — 12k requests impacted
• Fix: Increased heap size, added memory limits

**2. May 12 — Redis Cache Miss Storm** (resolved in 22m)
• Cache invalidation bug caused 90% miss rate
• Cascading load to PostgreSQL
• Fix: Hot-key detection + TTL adjustment

**3. May 5 — Connection Pool Exhaustion** ⚠️ Same pattern!
• Same endpoint: \`/api/orders/checkout\`
• Pool size was increased from 5 to 10
• **This suggests pool size needs more headroom for traffic growth**

📈 **Pattern detected:** Connection pool issues are recurring monthly. I recommend implementing auto-scaling for the pool size based on traffic patterns.`
  },
  {
    keywords: ['status', 'overview', 'health', 'system'],
    response: `**System Health Overview**

| Component | Status | Details |
|-----------|--------|---------|
| API Gateway | ✅ Healthy | 12ms avg latency |
| Auth Service | ⚠️ Slow | 2840ms P95 (Redis misses) |
| Order Service | 🔴 Critical | 34% error rate |
| Payment Service | ⚠️ Degraded | Stripe latency elevated |
| Search Service | ✅ Healthy | All metrics normal |

**Active incidents:** 3
**Uptime (24h):** 99.2%
**Total errors (1h):** 4,201

The primary concern is the Order Service. Auth Service degradation is secondary and may resolve once Redis cache stabilizes.`
  }
];

const FALLBACK = `I can help you debug API issues! Here are some things you can ask me:

• **"What's the latest incident?"** — Get a summary of the most recent failure
• **"Analyze the latency spike"** — Deep dive into response time issues
• **"Suggest a fix"** — Get actionable recommendations
• **"Show similar past incidents"** — Find patterns in historical data
• **"System health overview"** — Get a full status report

What would you like to investigate?`;

/**
 * Get an AI response for a user message.
 * @param {string} userMessage
 * @returns {string}
 */
export function getAIResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  for (const entry of RESPONSES) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.response;
    }
  }

  return FALLBACK;
}

/**
 * Get the welcome message.
 * @returns {string}
 */
export function getWelcomeMessage() {
  return `👋 Hi! I'm your **AI Debugging Assistant**, powered by Pulse AI.

I'm monitoring your API endpoints in real-time and I've detected some issues that need attention.

🔴 **Critical:** \`/api/orders/checkout\` is experiencing a 34% error rate due to DB connection pool exhaustion.

Ask me anything about your API health, incidents, or debugging recommendations.`;
}

/**
 * Get quick action suggestions.
 * @returns {string[]}
 */
export function getQuickActions() {
  return [
    'Explain the latest incident',
    'Analyze latency spike',
    'Suggest a fix',
    'Show similar incidents',
    'System health overview'
  ];
}
