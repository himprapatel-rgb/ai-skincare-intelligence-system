# AI Integration — Chat Assistant, GPT Upgrades, Streaming

**Sprint:** 2-4 (Weeks 3-8)
**Team Size:** 15 engineers
**Dependencies:** Database (chat tables), Backend (arq queue)

---

## AI1. AI Chat Assistant (TOP PRIORITY)

### Overview
Full conversational skincare advisor that knows the user's scan history, skin profile, product shelf, goals, and routines. Provides personalized advice via streaming responses.

### Backend

#### New Service: `app/services/ai_chat_service.py`
```python
class AIChatService:
    async def create_session(user_id, title) -> ChatSession
    async def send_message(session_id, user_message) -> AsyncGenerator[str, None]
    async def get_context(user_id) -> dict  # profile, scans, shelf, goals
    async def build_system_prompt(context) -> str
```

**Context Injection**: The AI chat has access to:
- User profile (skin type, concerns, allergies, goals)
- Last 5 scan results (scores, concerns, trends)
- Product shelf (active products, routines)
- Active goals and progress
- Ingredient safety database

**System Prompt Template**:
```
You are Pellicura AI, a clinical-grade skincare advisor.
User profile: {skin_type}, {concerns}, {allergies}
Recent scan: score {overall_score}, concerns: {concerns_list}
Active products: {shelf_products}
Goals: {active_goals}

Provide personalized, evidence-based skincare advice.
Never diagnose medical conditions. Recommend seeing a
dermatologist for persistent issues.
```

**Streaming**: Server-Sent Events (SSE) via FastAPI's `StreamingResponse`
```python
@router.post("/ai/chat/sessions/{session_id}/messages")
async def send_chat_message(session_id, body, user, db):
    async def generate():
        async for chunk in ai_chat_service.send_message(...):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Token Management**:
- Max context: 8,000 tokens per request
- Max history: last 20 messages per session
- Older messages summarized by AI before injection
- Track token usage per user for cost monitoring

#### New Router: `app/routers/ai_chat.py`
```
POST   /api/v1/ai/chat/sessions                    — create session
GET    /api/v1/ai/chat/sessions                    — list sessions (paginated)
GET    /api/v1/ai/chat/sessions/{id}               — get session details
GET    /api/v1/ai/chat/sessions/{id}/messages      — get message history
POST   /api/v1/ai/chat/sessions/{id}/messages      — send message (SSE)
DELETE /api/v1/ai/chat/sessions/{id}               — delete session
```

#### Database Tables
- `ai_chat_sessions` (id, user_id, title, message_count, status, created_at, updated_at)
- `ai_chat_messages` (id, session_id, role, content, metadata, token_count, created_at)

### Frontend

#### AIChatPage (`/chat`)
```
┌─────────────────────────────────────────┐
│  ← Chat History          New Chat [+]    │
├─────────────────────────────────────────┤
│                                         │
│  🤖 Hi! I'm your skincare advisor.     │
│     Based on your last scan, your       │
│     skin is looking great! Hydration    │
│     is up 15%. How can I help today?    │
│                                         │
│  Suggested questions:                   │
│  ┌─────────────────────────────────┐    │
│  │ What products should I add?     │    │
│  │ Why is my skin dry this week?   │    │
│  │ Review my morning routine       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  👤 What ingredient should I avoid      │
│     for my acne?                        │
│                                         │
│  🤖 Based on your combination skin      │
│     with acne concerns, I'd recommend   │
│     avoiding these ingredients...        │
│     ▊ (streaming cursor)                │
│                                         │
├─────────────────────────────────────────┤
│  [📎] Type your message...    [Send ➤]  │
└─────────────────────────────────────────┘
```

**Components**:
- `ChatPage.tsx` — main page with session list + chat view
- `ChatMessage.tsx` — message bubble (user/assistant)
- `ChatInput.tsx` — input with send button, attachment support
- `ChatSuggestions.tsx` — suggested question chips
- `ChatSessionList.tsx` — sidebar with session history
- `StreamingMessage.tsx` — handles SSE streaming display with typing indicator

**Features**:
- Streaming response with character-by-character display
- Markdown rendering in responses (bold, lists, links)
- Suggested follow-up questions after each response
- Chat history persistence (create/delete sessions)
- Copy message button
- "Ask about this scan" deep link from AnalysisResults
- "Ask about this product" deep link from ProductDetails

#### Floating Chat Widget
- Small chat bubble on all pages (bottom-right, above BottomNav on mobile)
- Click → opens mini chat or navigates to `/chat`
- Shows unread message indicator
- Component: `ChatWidget.tsx`

### Rate Limiting
- 50 messages per hour per user
- 10 sessions per day per user
- Token budget: 100K tokens per user per day

---

## AI2. Existing AI Endpoint Upgrades

### Recommendations (`POST /ai/recommendations`)
**Current**: Returns ranked product list
**Upgrades**:
- Add `explanation` field per product: "Recommended because of your dry skin + niacinamide preference"
- Add Redis caching: 1 hour per user, invalidate on new scan or shelf change
- Add fallback: return cached response if OpenAI is down
- Add cost tracking: log tokens used

### Routine Generation (`POST /ai/routine`)
**Current**: Returns AM/PM routine
**Upgrades**:
- Use user's actual shelf products in suggestion
- Add "difficulty" levels: minimal (3 steps), standard (5 steps), advanced (7+ steps)
- Add reasoning per step: "Cleanser first to remove overnight buildup"

### Ingredient Analysis (`POST /ai/ingredients`)
**Current**: Returns safety analysis
**Upgrades**:
- Personalize: flag ingredients user is allergic to (from profile)
- Add interaction warnings: "Retinol + AHA = increased sensitivity"
- Add pregnancy-safety flag
- Add comedogenic rating per ingredient

### Skin Prediction (`POST /ai/predict`)
**Current**: Predict future skin state
**Upgrades**:
- Use actual routine data (from shelf + routine builder)
- Add environmental factors (UV index, humidity from location)
- Return week-by-week timeline with confidence intervals
- Visualization-ready format for ProgressChart

### Scan Comparison (`POST /ai/compare`)
**Current**: AI narrative comparing two scans
**Upgrades**:
- Add metric-by-metric diff with direction indicators (↑↓→)
- Attribute improvements to specific products/routines
- Generate shareable comparison card

### Trend Detection (`POST /ai/trends`)
**Current**: Seasonal trends by location
**Upgrades**:
- Personalize to user's actual scan history patterns
- Add weekly/monthly trend detection
- Alert when negative trend detected

---

## AI3. New AI Endpoints

### Daily Brief (`GET /ai/daily-brief`)
**Sprint 3**
```json
{
  "greeting": "Good morning, Himanshu!",
  "skin_summary": "Your skin score is trending up +3 this week",
  "weather_tip": "UV index is 7 today. Don't skip SPF!",
  "routine_reminder": "Time for your morning routine",
  "product_tip": "Your CeraVe moisturizer expires in 2 weeks",
  "ai_tip": "Try applying hyaluronic acid on damp skin for better absorption"
}
```

### Ingredient Conflicts (`POST /ai/ingredient-conflicts`)
**Sprint 3**
- Input: two product ingredient lists
- Output: conflicts, warnings, synergies
- Example: "Vitamin C + Niacinamide = safe. Retinol + AHA = apply at different times."

### Product Review Summary (`POST /ai/product-review-summary`)
**Sprint 4**
- Input: product_id
- Output: AI-summarized review highlights, pros, cons, sentiment

---

## AI4. Infrastructure

### Cost Tracking
```python
# Log every AI call
ai_usage = AIUsageLog(
    user_id=user.id,
    endpoint="/ai/chat",
    model="gpt-4o-mini",
    input_tokens=prompt_tokens,
    output_tokens=completion_tokens,
    cost_usd=(prompt_tokens * 0.15 + completion_tokens * 0.60) / 1_000_000,
    duration_ms=elapsed,
    created_at=now()
)
```

### Caching Strategy
| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|-------------|
| /ai/recommendations | `ai:recs:{user_id}` | 1 hour | New scan, shelf change |
| /ai/routine | `ai:routine:{user_id}` | 1 hour | Shelf change, profile update |
| /ai/daily-brief | `ai:brief:{user_id}:{date}` | 6 hours | New scan |
| /ai/trends | `ai:trends:{location}` | 24 hours | None (location-based) |
| /ai/chat | No cache | N/A | Real-time |

### Fallback Strategy
1. Try OpenAI GPT-4o-mini (primary)
2. If timeout (>30s) → return cached last-good response with `stale: true`
3. If no cache → return hardcoded helpful defaults
4. Log failure for monitoring
5. Optional: Anthropic Claude as secondary (ANTHROPIC_API_KEY already in config)

### Model Selection
| Endpoint | Model | Reason |
|----------|-------|--------|
| Skin analysis (vision) | GPT-4V | Only model with vision capability |
| Chat | GPT-4o-mini | Cost-efficient for conversational |
| Recommendations | GPT-4o-mini | Structured output, fast |
| Daily brief | GPT-4o-mini | Short, fast |
| Complex analysis | GPT-4o | When higher quality needed |

---

## Deliverables
- [ ] AI Chat: backend service + router + SSE streaming working
- [ ] AI Chat: frontend page + floating widget
- [ ] All existing AI endpoints upgraded with caching + fallback
- [ ] Token usage tracking + cost dashboard in admin
- [ ] Daily brief endpoint live
- [ ] Ingredient conflict checker live
- [ ] Rate limiting on all AI endpoints
