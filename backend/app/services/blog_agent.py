"""
AI Blog Agent — Auto-generates skincare articles from real user data.

Uses aggregate scan trends, seasonal patterns, and ingredient research
to create evidence-based blog content. All articles are stored in the
Blog model and published via the existing content router.

This is NOT generic AI content — it's powered by Pellicura's proprietary
scan data, making our blog unique and data-driven.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.content import Blog
from app.models.scan import ScanSession
from app.services.ai_intelligence_service import _call_openai_json, AIServiceError

logger = logging.getLogger(__name__)


# Article templates based on data signals
ARTICLE_TYPES = [
    {
        "type": "trending_concern",
        "title_template": "Why {concern} Is Trending Right Now — And What To Do About It",
        "description": "Based on aggregate scan data showing rising concern levels",
    },
    {
        "type": "seasonal_guide",
        "title_template": "{season} Skincare Guide: What Your Skin Needs Right Now",
        "description": "Seasonal skincare tips based on environmental data",
    },
    {
        "type": "ingredient_spotlight",
        "title_template": "Ingredient Deep-Dive: {ingredient} — What The Science Says",
        "description": "Evidence-based ingredient analysis",
    },
    {
        "type": "data_insight",
        "title_template": "What {number} Skin Scans Taught Us About {topic}",
        "description": "Insights from aggregate anonymized scan data",
    },
    {
        "type": "routine_guide",
        "title_template": "The {skin_type} Skin Routine That Actually Works (Data-Backed)",
        "description": "Routine recommendations based on effectiveness data",
    },
]


async def generate_blog_article(
    article_type: str,
    context_data: Dict[str, Any],
    target_word_count: int = 1200,
) -> Dict[str, Any]:
    """
    Generate a full blog article using GPT-4o-mini.
    Returns structured article data ready for the Blog model.
    """
    system = (
        "You are a senior skincare journalist and dermatology content writer for Pellicura, "
        "a clinical-grade AI skincare platform. Write engaging, evidence-based articles. "
        "Rules: "
        "1. NEVER give medical diagnoses or prescriptions. "
        "2. Always recommend consulting a dermatologist for serious concerns. "
        "3. Use data from our platform to make articles unique (mention 'our data shows' or 'based on analysis'). "
        "4. Write in a warm, expert tone — like a knowledgeable friend who happens to be a skin expert. "
        "5. Include actionable tips with specific ingredient recommendations. "
        "6. Use short paragraphs, headers, and bullet points for mobile readability. "
        "7. Target word count: " + str(target_word_count) + " words."
    )

    prompt = (
        f"Article type: {article_type}\n"
        f"Context data: {json.dumps(context_data)}\n\n"
        "Generate a complete blog article. Return JSON:\n"
        "{\"title\": \"engaging SEO-friendly title\", "
        "\"slug\": \"url-friendly-slug\", "
        "\"excerpt\": \"2-3 sentence preview for cards/social\", "
        "\"content\": \"full HTML article with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags\", "
        "\"category\": \"skincare|ingredients|routines|trends|science\", "
        "\"tags\": [\"relevant\", \"search\", \"tags\"], "
        "\"read_time_min\": <estimated minutes>, "
        "\"meta_description\": \"SEO meta description under 160 chars\"}"
    )

    try:
        result = await _call_openai_json(system, prompt, max_tokens=4000)
        return result
    except AIServiceError as e:
        logger.error("Blog generation failed: %s", e)
        return None


def get_trending_concerns(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    """
    Analyze recent scans to find trending skin concerns.
    This uses REAL aggregate data — no individual user data exposed.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    try:
        scans = (
            db.query(ScanSession)
            .filter(ScanSession.created_at >= cutoff)
            .all()
        )

        concern_counts: Dict[str, int] = {}
        total_scans = 0

        for scan in scans:
            if not scan.analysis_result or not isinstance(scan.analysis_result, dict):
                continue
            total_scans += 1
            concerns = scan.analysis_result.get("summary", {}).get("concerns", [])
            for concern in concerns:
                if isinstance(concern, str):
                    concern_counts[concern] = concern_counts.get(concern, 0) + 1

        if not concern_counts:
            return []

        # Sort by frequency
        sorted_concerns = sorted(concern_counts.items(), key=lambda x: x[1], reverse=True)

        return [
            {
                "concern": concern,
                "count": count,
                "percentage": round(count / max(total_scans, 1) * 100, 1),
                "total_scans": total_scans,
            }
            for concern, count in sorted_concerns[:5]
        ]
    except Exception as e:
        logger.warning("Failed to get trending concerns: %s", e)
        return []


def get_seasonal_context() -> Dict[str, Any]:
    """Get current season and environmental context for seasonal articles."""
    now = datetime.utcnow()
    month = now.month

    if month in (12, 1, 2):
        season = "Winter"
        concerns = ["dehydration", "flaking", "redness", "chapped skin"]
        tips_focus = "hydration, barrier protection, gentle cleansing"
    elif month in (3, 4, 5):
        season = "Spring"
        concerns = ["allergies", "sensitivity", "uneven tone", "breakouts"]
        tips_focus = "gentle exfoliation, SPF transition, brightening"
    elif month in (6, 7, 8):
        season = "Summer"
        concerns = ["sun damage", "oiliness", "hyperpigmentation", "sweat breakouts"]
        tips_focus = "SPF, lightweight hydration, oil control"
    else:
        season = "Fall"
        concerns = ["dryness", "dullness", "repair from sun damage"]
        tips_focus = "repair, retinol introduction, deeper hydration"

    return {
        "season": season,
        "month": now.strftime("%B"),
        "year": now.year,
        "typical_concerns": concerns,
        "tips_focus": tips_focus,
    }


SPOTLIGHT_INGREDIENTS = [
    {"ingredient": "Niacinamide", "focus": "oil control, pore minimizing, barrier support"},
    {"ingredient": "Retinol", "focus": "anti-aging, cell turnover, acne prevention"},
    {"ingredient": "Vitamin C", "focus": "brightening, antioxidant protection, collagen"},
    {"ingredient": "Hyaluronic Acid", "focus": "hydration, plumping, barrier repair"},
    {"ingredient": "Salicylic Acid", "focus": "acne, exfoliation, pore cleansing"},
    {"ingredient": "Centella Asiatica", "focus": "soothing, repair, anti-inflammatory"},
    {"ingredient": "Azelaic Acid", "focus": "rosacea, hyperpigmentation, acne"},
    {"ingredient": "Ceramides", "focus": "barrier repair, moisture lock, eczema"},
    {"ingredient": "Bakuchiol", "focus": "natural retinol alternative, gentle anti-aging"},
    {"ingredient": "Tranexamic Acid", "focus": "dark spots, melasma, post-inflammatory hyperpigmentation"},
    {"ingredient": "Peptides", "focus": "collagen production, firming, fine lines"},
    {"ingredient": "Squalane", "focus": "lightweight hydration, non-comedogenic, all skin types"},
]


async def auto_generate_articles(
    db: Session,
    count: int = 3,
) -> List[Dict[str, Any]]:
    """
    Auto-generate blog articles based on real data signals.
    Called by a scheduled task or admin endpoint.

    Returns list of generated article data (already saved to DB).
    """
    generated = []

    # 1. Trending concern article
    trending = get_trending_concerns(db)
    if trending and len(generated) < count:
        top_concern = trending[0]
        article_data = await generate_blog_article(
            article_type="trending_concern",
            context_data={
                "concern": top_concern["concern"],
                "percentage": top_concern["percentage"],
                "total_scans_analyzed": top_concern["total_scans"],
                "top_5_concerns": trending,
            },
        )
        if article_data:
            article_data["data_source"] = "scan_trends"
            generated.append(article_data)

    # 2. Seasonal guide
    if len(generated) < count:
        seasonal = get_seasonal_context()
        article_data = await generate_blog_article(
            article_type="seasonal_guide",
            context_data=seasonal,
        )
        if article_data:
            article_data["data_source"] = "seasonal"
            generated.append(article_data)

    # 3. Ingredient spotlight (rotate through list)
    if len(generated) < count:
        # Pick ingredient based on day of year to rotate
        day_of_year = datetime.utcnow().timetuple().tm_yday
        ingredient = SPOTLIGHT_INGREDIENTS[day_of_year % len(SPOTLIGHT_INGREDIENTS)]
        article_data = await generate_blog_article(
            article_type="ingredient_spotlight",
            context_data=ingredient,
        )
        if article_data:
            article_data["data_source"] = "ingredient_research"
            generated.append(article_data)

    # Save to database
    saved = []
    for article in generated:
        try:
            # Check if slug already exists
            existing = db.query(Blog).filter(Blog.slug == article.get("slug", "")).first()
            if existing:
                continue

            blog = Blog(
                title=article.get("title", "Untitled"),
                slug=article.get("slug", f"article-{datetime.utcnow().strftime('%Y%m%d%H%M')}"),
                excerpt=article.get("excerpt", ""),
                content=article.get("content", ""),
                category=article.get("category", "skincare"),
                tags=article.get("tags", []),
                read_time_min=article.get("read_time_min", 5),
                published=True,
                published_at=datetime.utcnow(),
            )
            db.add(blog)
            db.commit()
            db.refresh(blog)
            saved.append({
                "id": blog.id,
                "title": blog.title,
                "slug": blog.slug,
                "category": blog.category,
                "data_source": article.get("data_source"),
            })
            logger.info("Generated blog article: %s", blog.title)
        except Exception as e:
            logger.warning("Failed to save article: %s", e)
            db.rollback()

    return saved
