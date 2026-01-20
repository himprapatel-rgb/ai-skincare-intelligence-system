# Rate Limiting Guide

> API rate limits and quota management

## Table of Contents
- [Overview](#overview)
- [Rate Limits](#rate-limits)
- [Handling Rate Limits](#handling-rate-limits)
- [Monitoring Usage](#monitoring-usage)

---

## Overview

The YouCam API implements rate limiting to ensure fair usage and system stability. This guide explains limits and best practices.

---

## Rate Limits

### Default Limits

| Plan | Requests/Second | Requests/Minute | Requests/Day |
|------|-----------------|-----------------|---------------|
| Free | 1 | 30 | 100 |
| Basic | 5 | 100 | 5,000 |
| Pro | 10 | 500 | 50,000 |
| Enterprise | Custom | Custom | Custom |

### Per-Endpoint Limits

| Endpoint Category | Additional Limits |
|-------------------|-------------------|
| Face Analysis | Standard |
| Makeup VTO | Standard |
| Hair Color VTO | Standard |
| Clothes VTO | 50% of standard |
| Full Look VTO | 50% of standard |

### Response Headers

Rate limit info is included in every response:

| Header | Description |
|--------|-------------|
| X-RateLimit-Limit | Max requests allowed |
| X-RateLimit-Remaining | Requests remaining |
| X-RateLimit-Reset | Unix timestamp of reset |
| Retry-After | Seconds until retry (429 only) |

---

## Handling Rate Limits

### 429 Response

When rate limited, you'll receive:

```json
{
  "resultCode": "429",
  "resultMsg": "Rate limit exceeded",
  "error": {
    "type": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 30
  }
}
```

### Retry Strategy

**Exponential Backoff:**

```javascript
const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
await sleep(delay);
```

**Respect Retry-After:**

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  await sleep(parseInt(retryAfter) * 1000);
}
```

### Best Practices

1. **Queue Requests** - Don't burst
2. **Cache Results** - Avoid duplicate calls
3. **Use Webhooks** - For async processing
4. **Batch When Possible** - Reduce call count
5. **Monitor Headers** - Track remaining quota

---

## Monitoring Usage

### API Dashboard

View usage stats at:
- [YouCam API Console](https://yce.makeupar.com/api-console/en/usage)

### Metrics Available

| Metric | Description |
|--------|-------------|
| Total Requests | All-time request count |
| Daily Usage | Requests per day |
| Error Rate | Failed request percentage |
| Response Time | Average latency |
| Quota Used | Current period usage |

### Usage Alerts

Configure alerts for:
- 80% quota usage
- High error rates
- Approaching rate limits

---

## Upgrading Limits

To increase limits:

1. Log into [API Console](https://yce.makeupar.com/api-console/en)
2. Navigate to Billing
3. Select higher plan
4. Limits update immediately

For enterprise needs, contact: YouCamOnlineEditor_API@perfectcorp.com

---

[← Back to Index](./README.md)
