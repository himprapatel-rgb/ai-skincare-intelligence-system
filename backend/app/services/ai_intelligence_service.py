"""
AI Intelligence Service — Central AI engine for Pellicura.

Provides GPT-powered features beyond skin scan analysis:
- Product recommendations ranked by AI
- Personalized routine generation
- Ingredient analysis (any ingredient list)
- Smart notifications (trend alerts, reminders)
- Content curation
- Before/after comparison
- Seasonal trend detection
- Search re-ranking

All calls go through OpenAI GPT-4o-mini for cost efficiency.
Results are cached in Redis when available.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.core.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

# Cost-efficient model for text-only AI tasks
AI_TEXT_MODEL = "gpt-4o-mini"


class AIServiceError(Exception):
    """Raised when the AI service encounters an error."""
    pass


async def _call_openai(
    system_prompt: str,
    user_prompt: str,
    model: str = AI_TEXT_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 2000,
) -> str:
    """Low-level OpenAI chat completion call. Returns raw content string."""
    if not settings.OPENAI_API_KEY:
        raise AIServiceError("OPENAI_API_KEY not configured")

    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    timeout = httpx.Timeout(settings.OPENAI_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{settings.OPENAI_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if resp.status_code >= 400:
        raise AIServiceError(f"OpenAI API error ({resp.status_code})")

    data = resp.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise AIServiceError("OpenAI returned empty content")
    return content


async def _call_openai_json(
    system_prompt: str,
    user_prompt: str,
    model: str = AI_TEXT_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 2000,
) -> Dict[str, Any]:
    """Call OpenAI and parse JSON response."""
    raw = await _call_openai(
        system_prompt=system_prompt + "\n\nReturn ONLY valid JSON. No markdown, no explanation.",
        user_prompt=user_prompt,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    # Strip markdown fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        raise AIServiceError(f"Failed to parse AI JSON: {cleaned[:200]}")


# =============================================================================
# 1. AI-POWERED PRODUCT RECOMMENDATIONS
# =============================================================================

async def ai_recommend_products(
    skin_type: str,
    concerns: List[str],
    products: List[Dict[str, Any]],
    budget: Optional[str] = None,
    max_results: int = 10,
) -> List[Dict[str, Any]]:
    """
    Rank and score products for a user based on their skin profile.

    Args:
        skin_type: User's skin type (oily, dry, combination, etc.)
        concerns: List of skin concerns (acne, wrinkles, etc.)
        products: List of product dicts with name, brand, category, ingredients
        budget: Optional budget preference (budget, mid-range, premium)
        max_results: Maximum products to return

    Returns:
        List of products with AI scores and reasoning
    """
    cache_key = f"ai_recs:{skin_type}:{','.join(sorted(concerns))}:{len(products)}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # Summarize products for the prompt (keep token count low)
    product_summaries = []
    for i, p in enumerate(products[:30]):  # Cap at 30 to control tokens
        summary = {
            "id": i,
            "name": p.get("name", ""),
            "brand": p.get("brand", ""),
            "category": p.get("category", ""),
            "key_ingredients": p.get("key_ingredients", [])[:5],
            "rating": p.get("average_rating"),
        }
        product_summaries.append(summary)

    system = (
        "You are a dermatology-trained skincare product recommender. "
        "Given a user's skin profile and a list of products, rank the top products by suitability. "
        "Consider ingredient compatibility, skin type match, and concern targeting."
    )

    user = json.dumps({
        "skin_type": skin_type,
        "concerns": concerns,
        "budget": budget,
        "max_results": max_results,
        "products": product_summaries,
    })

    prompt = (
        f"Rank these products for someone with {skin_type} skin and concerns: {', '.join(concerns)}. "
        f"Return JSON array: [{{'product_id': <id>, 'score': 0-100, 'reason': '<1 sentence>'}}]. "
        f"Top {max_results} only, sorted by score descending.\n\n{user}"
    )

    try:
        result = await _call_openai_json(system, prompt)
        # Map back to original product data
        ranked = []
        id_map = {i: p for i, p in enumerate(products[:30])}
        items = result if isinstance(result, list) else result.get("recommendations", result.get("products", []))
        for item in items[:max_results]:
            pid = item.get("product_id", item.get("id"))
            if pid is not None and pid in id_map:
                entry = {**id_map[pid], "ai_score": item.get("score", 0), "ai_reason": item.get("reason", "")}
                ranked.append(entry)
        await cache_set(cache_key, ranked, ttl_seconds=600)
        return ranked
    except AIServiceError:
        logger.warning("AI recommendation failed, returning unranked products")
        return products[:max_results]


# =============================================================================
# 2. AI ROUTINE BUILDER
# =============================================================================

async def ai_generate_routine(
    skin_type: str,
    concerns: List[str],
    shelf_products: List[Dict[str, Any]],
    goals: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generate a personalized AM/PM skincare routine.

    Returns:
        Dict with 'morning' and 'evening' routines, each a list of steps.
    """
    cache_key = f"ai_routine:{skin_type}:{','.join(sorted(concerns))}:{len(shelf_products)}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    products_summary = [
        {"name": p.get("product_name", p.get("name", "")), "category": p.get("product_category", p.get("category", "")), "brand": p.get("product_brand", p.get("brand", ""))}
        for p in shelf_products[:20]
    ]

    system = (
        "You are a clinical skincare routine architect. Build optimal AM and PM routines "
        "using the user's own products when possible. Fill gaps with product category suggestions. "
        "Order products correctly (cleanser → toner → serum → treatment → moisturizer → SPF for AM). "
        "Keep routines realistic (3-6 steps each)."
    )

    prompt_data = json.dumps({
        "skin_type": skin_type,
        "concerns": concerns,
        "goals": goals or [],
        "available_products": products_summary,
    })

    prompt = (
        f"Build AM and PM routines for {skin_type} skin with concerns: {', '.join(concerns)}.\n"
        f"User's products: {prompt_data}\n\n"
        "Return JSON: {\"morning\": [{\"step\": 1, \"category\": \"cleanser\", \"product\": \"product name or suggestion\", "
        "\"why\": \"brief reason\", \"duration\": \"30 seconds\"}], \"evening\": [...], "
        "\"tips\": [\"1-3 personalized tips\"], \"missing_products\": [\"categories user should add\"]}"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=2500)
        await cache_set(cache_key, result, ttl_seconds=1800)
        return result
    except AIServiceError:
        logger.warning("AI routine generation failed, returning default")
        return {
            "morning": [
                {"step": 1, "category": "cleanser", "product": "Gentle cleanser", "why": "Remove overnight buildup"},
                {"step": 2, "category": "moisturizer", "product": "Lightweight moisturizer", "why": "Hydrate skin"},
                {"step": 3, "category": "sunscreen", "product": "SPF 30+ sunscreen", "why": "UV protection"},
            ],
            "evening": [
                {"step": 1, "category": "cleanser", "product": "Gentle cleanser", "why": "Remove daily buildup"},
                {"step": 2, "category": "treatment", "product": "Treatment serum", "why": "Active ingredients work overnight"},
                {"step": 3, "category": "moisturizer", "product": "Night cream", "why": "Lock in moisture"},
            ],
            "tips": ["Be consistent with your routine", "Introduce new products one at a time"],
            "missing_products": [],
        }


# =============================================================================
# 3. AI INGREDIENT ANALYSIS
# =============================================================================

async def ai_analyze_ingredients(
    ingredients: List[str],
    skin_type: Optional[str] = None,
    concerns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    AI-powered ingredient analysis — works with ANY ingredient list.
    Goes beyond the static 100-ingredient safety database.
    """
    cache_key = f"ai_ingredients:{hash(tuple(sorted(ingredients)))}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    system = (
        "You are a cosmetic chemist specializing in skincare ingredient safety and efficacy. "
        "Analyze the given ingredients list. For each ingredient, assess safety, potential irritation, "
        "comedogenic risk, and efficacy for the user's skin type/concerns."
    )

    context = ""
    if skin_type:
        context += f"User's skin type: {skin_type}. "
    if concerns:
        context += f"User's concerns: {', '.join(concerns)}. "

    prompt = (
        f"{context}\nAnalyze these ingredients: {', '.join(ingredients[:50])}\n\n"
        "Return JSON: {\"overall_rating\": \"good/moderate/poor\", \"score\": 0-100, "
        "\"highlights\": [{\"ingredient\": \"name\", \"role\": \"what it does\", \"rating\": \"beneficial/neutral/caution/avoid\", "
        "\"note\": \"brief explanation\"}], "
        "\"concerns\": [\"any flagged issues\"], \"recommendations\": [\"usage tips\"]}"
    )

    try:
        result = await _call_openai_json(system, prompt)
        await cache_set(cache_key, result, ttl_seconds=3600)
        return result
    except AIServiceError:
        logger.warning("AI ingredient analysis failed")
        return {"overall_rating": "unknown", "score": 0, "highlights": [], "concerns": ["Analysis unavailable"], "recommendations": []}


# =============================================================================
# 4. SMART NOTIFICATIONS
# =============================================================================

async def ai_generate_notifications(
    user_profile: Dict[str, Any],
    recent_scans: List[Dict[str, Any]],
    shelf_products: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Generate personalized smart notifications based on user data.
    """
    system = (
        "You are a skincare wellness assistant. Generate 1-3 relevant, personalized notifications "
        "for the user based on their skin trends, product usage, and profile. "
        "Be specific and actionable, not generic."
    )

    user_data = json.dumps({
        "skin_type": user_profile.get("skin_type", "unknown"),
        "concerns": user_profile.get("concerns", []),
        "recent_scan_scores": [
            {"date": s.get("created_at", ""), "overall_score": s.get("overall_score", 0)}
            for s in recent_scans[:5]
        ],
        "product_count": len(shelf_products),
        "expiring_products": [
            p.get("product_name") for p in shelf_products
            if p.get("expiry_date") and p.get("status") == "active"
        ][:5],
    })

    prompt = (
        f"Generate smart notifications for this user:\n{user_data}\n\n"
        "Return JSON array: [{\"type\": \"trend_alert|reminder|tip|milestone\", "
        "\"title\": \"short title\", \"message\": \"personalized message\", "
        "\"priority\": \"high|medium|low\"}]"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=1000)
        items = result if isinstance(result, list) else result.get("notifications", [])
        return items[:3]
    except AIServiceError:
        return []


# =============================================================================
# 5. AI CONTENT CURATION
# =============================================================================

async def ai_curate_content(
    skin_type: str,
    concerns: List[str],
    available_content: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Rank and personalize content (blogs, videos) for a user.
    """
    if not available_content:
        return []

    content_summaries = [
        {"id": i, "title": c.get("title", ""), "category": c.get("category", ""), "tags": c.get("tags", [])}
        for i, c in enumerate(available_content[:20])
    ]

    system = (
        "You are a skincare content curator. Rank content by relevance to the user's skin type and concerns. "
        "Return only the most relevant items."
    )

    prompt = (
        f"User: {skin_type} skin, concerns: {', '.join(concerns)}.\n"
        f"Content: {json.dumps(content_summaries)}\n\n"
        "Return JSON array of the top 5-10 content IDs sorted by relevance: "
        "[{\"content_id\": <id>, \"relevance_score\": 0-100, \"reason\": \"brief\"}]"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=800)
        items = result if isinstance(result, list) else result.get("content", [])
        ranked = []
        for item in items:
            cid = item.get("content_id", item.get("id"))
            if cid is not None and 0 <= cid < len(available_content):
                entry = {**available_content[cid], "relevance_score": item.get("relevance_score", 0)}
                ranked.append(entry)
        return ranked
    except AIServiceError:
        return available_content[:10]


# =============================================================================
# 6. SMARTER DIGITAL TWIN (AI-ENHANCED SIMULATION)
# =============================================================================

async def ai_predict_skin_future(
    current_metrics: Dict[str, float],
    products_in_use: List[str],
    lifestyle_factors: Dict[str, Any],
    weeks_ahead: int = 4,
) -> Dict[str, Any]:
    """
    AI-powered skin prediction — replaces simple linear regression.
    """
    cache_key = f"ai_predict:{hash(json.dumps(current_metrics, sort_keys=True))}:{weeks_ahead}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    system = (
        "You are a dermatological AI predicting skin condition changes. "
        "Given current skin metrics, active products, and lifestyle, "
        "predict realistic changes over the specified period. "
        "Be conservative — skin changes slowly."
    )

    prompt = (
        f"Current metrics: {json.dumps(current_metrics)}\n"
        f"Products: {', '.join(products_in_use[:10])}\n"
        f"Lifestyle: {json.dumps(lifestyle_factors)}\n"
        f"Predict changes in {weeks_ahead} weeks.\n\n"
        "Return JSON: {\"predicted_metrics\": {\"hydration\": <value>, \"oiliness\": <value>, ...}, "
        "\"confidence\": 0-1, \"key_changes\": [\"what will improve/worsen and why\"], "
        "\"recommendations\": [\"adjustments to maximize improvement\"]}"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=1500)
        await cache_set(cache_key, result, ttl_seconds=3600)
        return result
    except AIServiceError:
        return {"predicted_metrics": current_metrics, "confidence": 0, "key_changes": [], "recommendations": []}


# =============================================================================
# 7. BEFORE/AFTER COMPARISON
# =============================================================================

async def ai_compare_scans(
    scan_before: Dict[str, Any],
    scan_after: Dict[str, Any],
) -> Dict[str, Any]:
    """
    AI analysis comparing two scan results over time.
    """
    system = (
        "You are a skin progress analyst. Compare two skin scan results taken at different times. "
        "Identify improvements, regressions, and areas needing attention."
    )

    prompt = (
        f"Before scan ({scan_before.get('date', 'earlier')}):\n"
        f"  Scores: {json.dumps(scan_before.get('scores', {}))}\n"
        f"  Concerns: {scan_before.get('concerns', [])}\n\n"
        f"After scan ({scan_after.get('date', 'later')}):\n"
        f"  Scores: {json.dumps(scan_after.get('scores', {}))}\n"
        f"  Concerns: {scan_after.get('concerns', [])}\n\n"
        "Return JSON: {\"overall_progress\": \"improved/stable/declined\", "
        "\"score_change\": <number>, \"improvements\": [\"what got better\"], "
        "\"regressions\": [\"what got worse\"], \"unchanged\": [\"stable areas\"], "
        "\"insights\": \"personalized summary\", \"next_steps\": [\"recommendations\"]}"
    )

    try:
        return await _call_openai_json(system, prompt, max_tokens=1500)
    except AIServiceError:
        return {"overall_progress": "unknown", "score_change": 0, "improvements": [], "regressions": [], "insights": "Comparison unavailable"}


# =============================================================================
# 8. AI SEARCH RE-RANKING
# =============================================================================

async def ai_rerank_search(
    query: str,
    skin_type: str,
    concerns: List[str],
    products: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Re-rank product search results by predicted suitability for user.
    """
    if len(products) <= 3:
        return products  # Not worth an API call for tiny results

    cache_key = f"ai_rerank:{hash(query)}:{skin_type}:{len(products)}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    summaries = [
        {"id": i, "name": p.get("name", ""), "brand": p.get("brand", ""), "category": p.get("category", "")}
        for i, p in enumerate(products[:20])
    ]

    system = "You are a skincare product search assistant. Re-rank search results by relevance to the user's skin needs."

    prompt = (
        f"Query: '{query}', User: {skin_type} skin, concerns: {', '.join(concerns)}.\n"
        f"Results: {json.dumps(summaries)}\n\n"
        "Return JSON array of product IDs in optimal order: [0, 3, 1, 2, ...]"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=500)
        order = result if isinstance(result, list) else result.get("order", list(range(len(products))))
        reranked = []
        for idx in order:
            if isinstance(idx, int) and 0 <= idx < len(products):
                reranked.append(products[idx])
        # Append any products not in the ranking
        seen = set(order)
        for i, p in enumerate(products):
            if i not in seen:
                reranked.append(p)
        await cache_set(cache_key, reranked, ttl_seconds=300)
        return reranked
    except AIServiceError:
        return products


# =============================================================================
# 9. SEASONAL TREND DETECTION
# =============================================================================

async def ai_detect_seasonal_trends(
    scan_history: List[Dict[str, Any]],
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze scan history for seasonal patterns.
    """
    if len(scan_history) < 3:
        return {"patterns": [], "insights": "Need more scan history for trend detection", "recommendations": []}

    history_summary = [
        {"date": s.get("created_at", ""), "scores": s.get("scores", {}), "overall": s.get("overall_score", 0)}
        for s in scan_history[:20]
    ]

    system = (
        "You are a dermatological data analyst. Identify seasonal or temporal patterns "
        "in skin condition data. Look for cyclical changes, gradual trends, and anomalies."
    )

    location_ctx = f"User location: {location}. " if location else ""
    prompt = (
        f"{location_ctx}Scan history:\n{json.dumps(history_summary)}\n\n"
        "Return JSON: {\"patterns\": [{\"type\": \"seasonal|gradual|anomaly\", "
        "\"description\": \"what was observed\", \"metrics_affected\": [\"which scores\"]}], "
        "\"insights\": \"overall trend summary\", \"recommendations\": [\"proactive tips\"], "
        "\"predicted_next_change\": \"what to expect next\"}"
    )

    try:
        return await _call_openai_json(system, prompt, max_tokens=1500)
    except AIServiceError:
        return {"patterns": [], "insights": "Analysis unavailable", "recommendations": []}


# =============================================================================
# 10. PROFILE-INFORMED SCAN CONTEXT
# =============================================================================

def build_profile_context(user_profile: Dict[str, Any]) -> str:
    """
    Build a context string from user profile to enhance scan analysis.
    This gets injected into the OpenAI Vision prompt for better results.
    """
    parts = []
    if user_profile.get("skin_type"):
        parts.append(f"Known skin type: {user_profile['skin_type']}")
    if user_profile.get("age"):
        parts.append(f"Age: {user_profile['age']}")
    if user_profile.get("concerns"):
        parts.append(f"Primary concerns: {', '.join(user_profile['concerns'])}")
    if user_profile.get("climate"):
        parts.append(f"Climate: {user_profile['climate']}")
    if user_profile.get("water_intake"):
        parts.append(f"Hydration: {user_profile['water_intake']}")
    if user_profile.get("sleep_hours"):
        parts.append(f"Sleep: ~{user_profile['sleep_hours']}h/night")

    if not parts:
        return ""
    return "User context: " + ". ".join(parts) + ". Use this context to calibrate your analysis."
