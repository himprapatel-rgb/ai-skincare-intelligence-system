# Authentication Guide

> API authentication and key management

## Table of Contents
- [Overview](#overview)
- [Getting API Keys](#getting-api-keys)
- [Authentication Methods](#authentication-methods)
- [Security Best Practices](#security-best-practices)

---

## Overview

All YouCam API requests require authentication using Bearer tokens. This guide covers how to obtain and use API keys securely.

---

## Getting API Keys

### Step 1: Create Account

1. Visit [YouCam API Console](https://yce.makeupar.com/api-console/en/api-keys)
2. Sign up or log in to your account
3. Complete email verification

### Step 2: Generate API Key

1. Navigate to API Keys section
2. Click "Create New Key"
3. Select API products to enable
4. Set usage limits (optional)
5. Copy and securely store your key

### API Key Format

```
yce_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** API keys are shown only once. Store them securely.

---

## Authentication Methods

### Bearer Token (Recommended)

Include your API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Example Request

```bash
curl -X POST https://yce-api-01.makeupar.com/api/skinanalysispro/v2 \
  -H "Authorization: Bearer yce_api_xxxxxxxx" \
  -H "Content-Type: multipart/form-data" \
  -F "selfie=@photo.jpg"
```

### Response Headers

Successful authenticated requests include:

| Header | Description |
|--------|-------------|
| X-Request-Id | Unique request identifier |
| X-RateLimit-Remaining | Remaining requests |
| X-RateLimit-Reset | Rate limit reset time |

---

## Security Best Practices

### Do's

- Store API keys in environment variables
- Use server-side calls only
- Rotate keys regularly
- Monitor usage in dashboard
- Use separate keys for dev/production

### Don'ts

- Never expose keys in client-side code
- Don't commit keys to version control
- Avoid sharing keys via email/chat
- Don't use production keys for testing

### Environment Variables

```bash
# .env file (never commit)
YOUCAM_API_KEY=yce_api_xxxxxxxx
```

```javascript
// Node.js example
const apiKey = process.env.YOUCAM_API_KEY;
```

### Key Rotation

1. Generate new key in console
2. Update application configuration
3. Test with new key
4. Revoke old key

---

## Authentication Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Invalid API key | Check key is correct |
| 403 | Key disabled/revoked | Generate new key |
| 429 | Rate limit exceeded | Wait or upgrade plan |

### Error Response Example

```json
{
  "resultCode": "401",
  "resultMsg": "Authentication failed",
  "error": {
    "type": "INVALID_API_KEY",
    "message": "The provided API key is invalid or expired"
  }
}
```

---

[← Back to Index](./README.md)
