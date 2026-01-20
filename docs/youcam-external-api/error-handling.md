# Error Handling Guide

> API error codes, messages, and troubleshooting

## Table of Contents
- [Overview](#overview)
- [HTTP Status Codes](#http-status-codes)
- [API Error Codes](#api-error-codes)
- [Troubleshooting](#troubleshooting)

---

## Overview

The YouCam API uses standard HTTP status codes combined with detailed error messages to help you identify and resolve issues.

### Error Response Format

```json
{
  "resultCode": "ERROR_CODE",
  "resultMsg": "Error description",
  "error": {
    "type": "ERROR_TYPE",
    "message": "Detailed error message",
    "field": "affected_field"
  }
}
```

---

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Endpoint not found |
| 413 | Payload Too Large | File size exceeds limit |
| 415 | Unsupported Media | Invalid file format |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Service temporarily down |

---

## API Error Codes

### Authentication Errors

| Code | Description | Solution |
|------|-------------|----------|
| INVALID_API_KEY | API key is invalid | Verify API key |
| EXPIRED_API_KEY | API key has expired | Generate new key |
| MISSING_AUTH | No authorization header | Add Bearer token |
| INSUFFICIENT_PERMISSIONS | Key lacks permissions | Check key settings |

### Input Errors

| Code | Description | Solution |
|------|-------------|----------|
| MISSING_PARAMETER | Required parameter missing | Check required fields |
| INVALID_PARAMETER | Parameter value invalid | Verify parameter format |
| INPUT_ERROR | Incorrect file format | Use supported format |
| FILE_TOO_LARGE | File exceeds size limit | Compress or resize |

### Processing Errors

| Code | Description | Solution |
|------|-------------|----------|
| RUNTIME_ERROR | Processing failed | Retry request |
| PHOTO_DETECTION_FAIL | Image processing failed | Use clearer image |
| FACE_NOT_DETECTED | No face in image | Center face in frame |
| BODY_DETECTION_FAIL | Body not detected | Use full-body image |
| FEATURE_NOT_DETECTED | Feature not visible | Improve image quality |

### Rate Limiting Errors

| Code | Description | Solution |
|------|-------------|----------|
| RATE_LIMIT_EXCEEDED | Too many requests | Wait and retry |
| QUOTA_EXCEEDED | Monthly quota reached | Upgrade plan |

---

## Troubleshooting

### Common Issues

**Issue: 401 Unauthorized**
```
Solution:
1. Verify API key is correct
2. Check Authorization header format
3. Ensure key is not expired
```

**Issue: Face Not Detected**
```
Solution:
1. Use front-facing photo
2. Ensure good lighting
3. Remove obstructions
4. Increase image resolution
```

**Issue: File Too Large**
```
Solution:
1. Compress image (max 10MB)
2. Reduce resolution
3. Use JPEG format
```

### Retry Strategy

```javascript
async function apiCallWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await makeRequest(request);
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        await sleep(Math.pow(2, i) * 1000);
      } else {
        throw error;
      }
    }
  }
}
```

---

[← Back to Index](./README.md)
