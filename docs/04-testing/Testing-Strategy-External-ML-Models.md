# 🧪 Testing Strategy - External ML Models

**AI Skincare Intelligence System**
**Version**: 1.0  
**Last Updated**: December 23, 2025
**Status**: Active

---

## 📝 Executive Summary

Comprehensive testing strategy for External Pre-Trained ML Model Integration (Epic 16) covering unit tests, integration tests, performance tests, security tests, and deployment validation.

**Test Coverage Goals**:
- Unit Test Coverage: ≥90%
- Integration Test Coverage: ≥85%
- E2E Test Coverage: Critical paths only
- Performance Test: All NFRs validated

---

## 🎯 Section 1: Unit Testing

### 1.1 Model Loader Service Tests

**Test Cases**:
1. ✅ Test model loading from Hugging Face
2. ✅ Test model loading from OpenAI
3. ✅ Test model loading from Google Cloud
4. ✅ Test model caching behavior
5. ✅ Test model load timeout handling
6. ✅ Test invalid model ID error handling
7. ✅ Test credential validation

**Example Test**:
```python
def test_huggingface_model_load():
    loader = ModelLoader()
    model = loader.load("huggingface/skin-analysis-v2")
    assert model is not None
    assert model.version == "v2"
    assert model.provider == "huggingface"
```

### 1.2 External API Client Tests

**Test Cases**:
1. ✅ Test API authentication
2. ✅ Test request formation
3. ✅ Test response parsing
4. ✅ Test retry logic (3 attempts)
5. ✅ Test timeout handling (30s)
6. ✅ Test circuit breaker (5 failures)
7. ✅ Test fallback to internal model

### 1.3 Cost Tracking Tests

**Test Cases**:
1. ✅ Test cost calculation per inference
2. ✅ Test daily budget enforcement
3. ✅ Test cost alert threshold (80%)
4. ✅ Test cost aggregation by provider
5. ✅ Test budget reset logic

---

## 🔗 Section 2: Integration Testing

### 2.1 End-to-End Inference Flow

**Scenario 1: Successful External Inference**
```gherkin
Given a valid user authentication token
And an external model "huggingface/skin-analysis-v2" is configured
When I POST to /api/v1/inference/external with image_url
Then I receive 200 OK
And response contains model_version
And response contains results.conditions
And response time is <3 seconds (P95)
```

**Scenario 2: Fallback to Internal Model**
```gherkin
Given external model provider is unavailable
When I POST to /api/v1/inference/external
Then circuit breaker opens after 5 failures
And system falls back to internal model
And response contains fallback: true
And inference completes successfully
```

### 2.2 Model List Endpoint Tests

**Test Cases**:
1. ✅ GET /api/v1/models returns all models
2. ✅ Filter by type=internal
3. ✅ Filter by type=external  
4. ✅ Filter by active_only=true
5. ✅ Response includes cost_per_request
6. ✅ Response includes avg_latency_ms

### 2.3 Database Integration Tests

**Test Cases**:
1. ✅ Model version stored in inference_results
2. ✅ External model metadata stored correctly
3. ✅ Query by model_version works
4. ✅ Inference history filtering by model

---

## ⚡ Section 3: Performance Testing

### 3.1 Load Testing

**Test Scenarios**:

**Scenario 1: Sustained Load**
- Duration: 30 minutes
- RPS: 50 requests/second to /inference/external
- Expected: P95 latency <3s, success rate >99.5%

**Scenario 2: Spike Test**
- Ramp from 10 to 100 RPS in 1 minute
- Sustain 100 RPS for 5 minutes
- Expected: No failures, latency degradation <20%

**Scenario 3: Stress Test**  
- Gradually increase to system limits
- Identify breaking point
- Expected: Graceful degradation, no crashes

**Load Testing Tool**: Locust or k6

```python
# Locust test example
class ExternalModelUser(HttpUser):
    @task
    def external_inference(self):
        self.client.post("/api/v1/inference/external", json={
            "image_url": "https://test.com/img.jpg",
            "model_name": "huggingface/skin-analysis-v2"
        })
```

### 3.2 NFR Validation Tests

**NFR-ML-1: Model Loading Performance**
- Test: Load 10 different models
- Measure: Time to load each
- Assert: <5s (small), <15s (medium), <30s (large)

**NFR-ML-2: Inference Latency**
- Test: 1000 inference requests
- Measure: P50, P95, P99 latencies
- Assert: P95 <3s, P99 <5s

**NFR-ML-3: API Reliability**
- Test: Simulate external API failures
- Measure: Retry attempts, fallback triggers
- Assert: 99.5% success rate

**NFR-ML-4: Cost Management**
- Test: Exceed daily budget
- Assert: Requests blocked, alerts triggered

---

## 🔒 Section 4: Security Testing

### 4.1 Credential Security Tests

**Test Cases**:
1. ✅ API keys encrypted at rest
2. ✅ API keys not logged
3. ✅ API keys not exposed in responses
4. ✅ Invalid credentials rejected
5. ✅ Credential rotation works

### 4.2 Input Validation Tests

**Test Cases**:
1. ✅ Malicious image URLs rejected
2. ✅ SQL injection attempts blocked
3. ✅ XSS attempts sanitized
4. ✅ Model name validation
5. ✅ Rate limiting enforced

### 4.3 OWASP Top 10 Validation

- ✅ A01: Broken Access Control
- ✅ A02: Cryptographic Failures
- ✅ A03: Injection
- ✅ A05: Security Misconfiguration
- ✅ A07: Identification and Authentication Failures

---

## 🧩 Section 5: Regression Testing

### 5.1 Backward Compatibility Tests

**Test Cases**:
1. ✅ V1 API still works with X-API-Version: v1
2. ✅ Internal model inference unchanged
3. ✅ Existing frontend continues to work
4. ✅ Database migrations non-breaking

### 5.2 Smoke Tests

Run after every deployment:
1. ✅ Health check endpoint returns 200
2. ✅ Internal model inference works
3. ✅ External model inference works
4. ✅ Model list endpoint works
5. ✅ Authentication works

---

## 📈 Section 6: Monitoring & Observability Tests

### 6.1 Metrics Validation

**Test Cases**:
1. ✅ `api.inference.external.requests.total` increments
2. ✅ `api.inference.external.latency_ms` recorded
3. ✅ `ml.external_model.cost_usd` tracked
4. ✅ `api.inference.fallback.total` counted

### 6.2 Logging Validation

**Test Cases**:
1. ✅ Inference logs include model_version
2. ✅ Errors logged with stack traces
3. ✅ Costs logged per request
4. ✅ Latency logged per request

### 6.3 Alerting Validation  

**Test Cases**:
1. ✅ Cost threshold alert triggers at 80%
2. ✅ Latency degradation alert triggers
3. ✅ Circuit breaker open alert triggers
4. ✅ External API failure alert triggers

---

## 🚀 Section 7: Deployment Testing

### 7.1 Staging Environment Tests

**Pre-Deployment Checklist**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance tests meet NFRs
- [ ] Security scan clean
- [ ] Database migrations tested
- [ ] Configuration validated

### 7.2 Production Deployment Validation

**Phase 1: Canary Deployment (10% traffic)**
- Monitor: Error rate, latency, costs
- Duration: 2 hours
- Rollback criteria: Error rate >1%

**Phase 2: Gradual Rollout (50% traffic)**
- Monitor: Same as Phase 1
- Duration: 24 hours
- Rollback criteria: Any NFR violation

**Phase 3: Full Rollout (100% traffic)**
- Monitor: Continuous
- Duration: Ongoing

---

## 📊 Section 8: Test Automation

### 8.1 CI/CD Pipeline Integration

**Pipeline Stages**:
1. **Build**: Compile code
2. **Unit Tests**: Run all unit tests
3. **Integration Tests**: Run integration suite
4. **Security Scan**: SAST/DAST
5. **Performance Tests**: Run on PR to main
6. **Deploy to Staging**: Auto-deploy
7. **Smoke Tests**: Validate staging
8. **Deploy to Production**: Manual approval

### 8.2 Test Data Management

**Test Fixtures**:
- Mock external API responses
- Sample images for inference
- Test user accounts
- Seeded database with model metadata

---

## ✅ Section 9: Acceptance Criteria

### 9.1 Definition of Done

- [x] All unit tests written and passing (≥90% coverage)
- [x] All integration tests written and passing
- [x] Performance tests validate all 4 NFRs
- [x] Security tests pass OWASP Top 10
- [x] Regression tests confirm no breaking changes
- [x] Documentation updated
- [x] Code reviewed and approved
- [x] Deployed to staging successfully
- [ ] Production deployment successful
- [ ] 24-hour production monitoring clean

### 9.2 Success Metrics

- ✅ 99.5% test success rate in CI/CD
- ✅ <5 minute test suite execution time
- ✅ Zero production incidents related to external models
- ✅ All NFRs met in production

---

## 📖 References

1. [SRS V5.3](../01-requirements/SRS-V5.3-External-Pretrained-ML.md)
2. [API-IMPACT-ANALYSIS.md](./API-IMPACT-ANALYSIS.md)
3. [CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md](./CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md)

---

**Document Owner**: QA & ML Team  
**Review Cycle**: After each sprint
**Next Review**: January 23, 2026
