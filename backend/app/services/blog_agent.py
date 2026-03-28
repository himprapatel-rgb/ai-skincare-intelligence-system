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


# Article templates — mix of data-driven and marketing content
ARTICLE_TYPES = [
    # Data-driven (from scan analytics)
    {"type": "trending_concern", "category": "data"},
    {"type": "seasonal_guide", "category": "data"},
    {"type": "ingredient_spotlight", "category": "data"},
    {"type": "data_insight", "category": "data"},
    {"type": "routine_guide", "category": "data"},
    # Marketing / general skincare (for SEO + social sharing)
    {"type": "skincare_myth_busting", "category": "marketing"},
    {"type": "beginners_guide", "category": "marketing"},
    {"type": "product_category_guide", "category": "marketing"},
    {"type": "skin_type_deep_dive", "category": "marketing"},
    {"type": "lifestyle_and_skin", "category": "marketing"},
    {"type": "trending_in_beauty", "category": "marketing"},
    {"type": "before_after_tips", "category": "marketing"},
]

# Unsplash-style cover image URLs by category (free, no attribution required)
COVER_IMAGES = {
    "skincare": [
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&h=630&fit=crop",
    ],
    "ingredients": [
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&h=630&fit=crop",
    ],
    "routines": [
        "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1200&h=630&fit=crop",
    ],
    "trends": [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&h=630&fit=crop",
    ],
    "science": [
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=630&fit=crop",
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=630&fit=crop",
    ],
}


def _get_cover_image(category: str) -> str:
    """Get a cover image URL based on category, rotating by day."""
    images = COVER_IMAGES.get(category, COVER_IMAGES["skincare"])
    day = datetime.utcnow().timetuple().tm_yday
    return images[day % len(images)]


# Marketing article topics that rotate daily
MARKETING_TOPICS = [
    {"topic": "10 Skincare Mistakes You're Probably Making (And How to Fix Them)", "type": "skincare_myth_busting", "focus": "common mistakes, myths vs facts, evidence-based corrections"},
    {"topic": "The Complete Beginner's Guide to Building a Skincare Routine", "type": "beginners_guide", "focus": "step-by-step for new users, product order, what to buy first"},
    {"topic": "Serums 101: How to Pick the Right One for Your Skin", "type": "product_category_guide", "focus": "types of serums, active ingredients, when to use"},
    {"topic": "Oily Skin Decoded: Everything You Need to Know", "type": "skin_type_deep_dive", "focus": "causes, best ingredients, routine tips, myths"},
    {"topic": "How Your Diet Affects Your Skin (What Science Actually Says)", "type": "lifestyle_and_skin", "focus": "nutrition, gut-skin axis, foods to eat/avoid"},
    {"topic": "The Rise of Skin Cycling: Is This Trend Worth It?", "type": "trending_in_beauty", "focus": "what it is, how to do it, who it's for, results"},
    {"topic": "Morning vs Night Routine: What Goes When (And Why It Matters)", "type": "routine_guide", "focus": "product timing, AM antioxidants, PM repair"},
    {"topic": "Sensitive Skin Survival Guide: Products That Won't Irritate", "type": "skin_type_deep_dive", "focus": "triggers, barrier repair, gentle ingredients"},
    {"topic": "SPF Myths Debunked: What Your Sunscreen Is (And Isn't) Doing", "type": "skincare_myth_busting", "focus": "SPF numbers, reapplication, chemical vs mineral"},
    {"topic": "How Stress Shows Up on Your Skin (And What To Do About It)", "type": "lifestyle_and_skin", "focus": "cortisol, breakouts, aging, relaxation techniques"},
    {"topic": "The Truth About Anti-Aging: What Actually Works in Your 20s, 30s, and 40s", "type": "before_after_tips", "focus": "age-specific advice, prevention vs treatment"},
    {"topic": "Double Cleansing: The Method That Changed K-Beauty Forever", "type": "trending_in_beauty", "focus": "how-to, oil vs water cleanser, who needs it"},
    {"topic": "Hyperpigmentation: Types, Causes, and Proven Treatments", "type": "skin_type_deep_dive", "focus": "melasma, PIH, sun spots, ingredients that work"},
    {"topic": "Building a Budget Skincare Routine Under $50", "type": "beginners_guide", "focus": "affordable picks, drugstore heroes, what to skip"},
    {"topic": "The Science Behind Retinol: Your Complete Guide", "type": "ingredient_spotlight", "focus": "how it works, how to start, side effects, alternatives"},
    {"topic": "Why Your Skin Looks Different in Winter (And Your Routine Should Too)", "type": "seasonal_guide", "focus": "cold weather effects, heavier moisturizers, barrier protection"},
    {"topic": "Acne at Every Age: Teen, Adult, and Hormonal Breakouts Explained", "type": "skin_type_deep_dive", "focus": "causes by age, treatments, when to see a derm"},
    {"topic": "Glass Skin, Dolphin Skin, Latte Skin: Decoding Beauty Trends", "type": "trending_in_beauty", "focus": "what each means, achievable goals, products to try"},
    {"topic": "The Ingredient Pairing Guide: What Works Together (And What Doesn't)", "type": "ingredient_spotlight", "focus": "synergies, conflicts, AM/PM separation"},
    {"topic": "How to Read a Skincare Label Like a Dermatologist", "type": "beginners_guide", "focus": "INCI names, order matters, red flags, green flags"},
    {"topic": "Dark Circles: Why You Have Them and What Actually Helps", "type": "skin_type_deep_dive", "focus": "genetics, lifestyle, ingredients, treatments"},
    {"topic": "Exfoliation Guide: AHA vs BHA vs PHA — Which One Do You Need?", "type": "product_category_guide", "focus": "types, skin type matching, frequency, over-exfoliation"},
    {"topic": "Your Skin Barrier: What It Is, Why It Breaks, and How to Fix It", "type": "science", "focus": "ceramides, fatty acids, signs of damage, repair routine"},
    {"topic": "Niacinamide: The Multi-Tasking Ingredient Your Skin Needs", "type": "ingredient_spotlight", "focus": "benefits, concentrations, combinations, who it's for"},
    {"topic": "Skincare for Men: A No-Nonsense Starter Guide", "type": "beginners_guide", "focus": "basics, shaving care, simple routines, product picks"},
    {"topic": "The Truth About Pores: Can You Actually Shrink Them?", "type": "skincare_myth_busting", "focus": "what pores are, minimizing appearance, ingredients"},
    {"topic": "Post-Workout Skincare: What to Do Before, During, and After the Gym", "type": "lifestyle_and_skin", "focus": "sweat, breakouts, cleansing, SPF reapplication"},
    {"topic": "How to Transition Your Skincare Routine Between Seasons", "type": "seasonal_guide", "focus": "gradual swaps, layering changes, new concerns"},
    {"topic": "Vitamin C in Skincare: Forms, Stability, and How to Use It Right", "type": "ingredient_spotlight", "focus": "L-ascorbic acid, derivatives, storage, combinations"},
    {"topic": "The Ultimate Guide to Moisturizers: Gel, Cream, Oil, or Balm?", "type": "product_category_guide", "focus": "textures, skin types, layering, when to use each"},
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
        f"Context data: {json.dumps(context_data)}\n"
        f"Today's date: {datetime.utcnow().strftime('%B %d, %Y')}\n\n"
        "Generate a complete blog article optimized for marketing and SEO. Return JSON:\n"
        "{\"title\": \"engaging, clickable SEO title (50-60 chars)\", "
        "\"slug\": \"url-friendly-slug-with-keywords\", "
        "\"excerpt\": \"compelling 2-3 sentence preview that makes people click\", "
        "\"content\": \"full HTML article with proper structure: "
        "<h2> for main sections, <h3> for subsections, <p> for paragraphs, "
        "<ul><li> for lists, <strong> for key terms, <em> for emphasis, "
        "<blockquote> for expert quotes. "
        "Include a 'Key Takeaways' section at the top as bullet points. "
        "Include a 'The Bottom Line' conclusion. "
        "Add inline tips with <div class='blog-tip'><strong>Pro Tip:</strong> tip text</div>. "
        "Make content mobile-friendly with short paragraphs (2-3 sentences max).\", "
        "\"category\": \"skincare|ingredients|routines|trends|science\", "
        "\"tags\": [\"5-8 relevant SEO tags\"], "
        "\"read_time_min\": <estimated minutes>, "
        "\"meta_description\": \"SEO meta description under 155 chars with keyword\"}"
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


async def auto_generate_daily_article(db: Session) -> Optional[Dict[str, Any]]:
    """
    Generate ONE article per day. Alternates between data-driven and marketing.
    Called automatically on app startup if no article was posted today.
    """
    # Check if article was already posted today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_today = (
        db.query(Blog)
        .filter(Blog.created_at >= today_start)
        .first()
    )
    if existing_today:
        logger.info("Daily article already exists: %s", existing_today.title)
        return None

    day_of_year = datetime.utcnow().timetuple().tm_yday

    # Alternate: even days = data-driven, odd days = marketing
    if day_of_year % 2 == 0:
        # Data-driven article
        trending = get_trending_concerns(db)
        if trending:
            article_data = await generate_blog_article(
                article_type="trending_concern",
                context_data={
                    "concern": trending[0]["concern"],
                    "percentage": trending[0]["percentage"],
                    "total_scans_analyzed": trending[0]["total_scans"],
                    "top_5_concerns": trending,
                },
            )
        else:
            # Fallback to seasonal if no scan data yet
            article_data = await generate_blog_article(
                article_type="seasonal_guide",
                context_data=get_seasonal_context(),
            )
        data_source = "scan_data"
    else:
        # Marketing article — rotate through topics
        topic = MARKETING_TOPICS[day_of_year % len(MARKETING_TOPICS)]
        article_data = await generate_blog_article(
            article_type=topic["type"],
            context_data=topic,
        )
        data_source = "marketing"

    if not article_data:
        logger.warning("Failed to generate daily article")
        return None

    # Add cover image
    category = article_data.get("category", "skincare")
    article_data["cover_image_url"] = _get_cover_image(category)
    article_data["data_source"] = data_source

    # Save to database
    result = _save_article(db, article_data)
    if result:
        logger.info("Daily article generated: %s", result.get("title"))
    return result


async def auto_generate_articles(
    db: Session,
    count: int = 3,
) -> List[Dict[str, Any]]:
    """
    Generate multiple articles at once. Used by admin endpoint.
    Mix of data-driven and marketing content, all with cover images.
    """
    generated = []
    day_of_year = datetime.utcnow().timetuple().tm_yday

    # 1. Trending concern article (data-driven)
    trending = get_trending_concerns(db)
    if trending and len(generated) < count:
        article_data = await generate_blog_article(
            article_type="trending_concern",
            context_data={
                "concern": trending[0]["concern"],
                "percentage": trending[0]["percentage"],
                "total_scans_analyzed": trending[0]["total_scans"],
                "top_5_concerns": trending,
            },
        )
        if article_data:
            article_data["data_source"] = "scan_trends"
            article_data["cover_image_url"] = _get_cover_image(article_data.get("category", "skincare"))
            generated.append(article_data)

    # 2. Marketing article (for SEO + social)
    if len(generated) < count:
        topic = MARKETING_TOPICS[day_of_year % len(MARKETING_TOPICS)]
        article_data = await generate_blog_article(
            article_type=topic["type"],
            context_data=topic,
        )
        if article_data:
            article_data["data_source"] = "marketing"
            article_data["cover_image_url"] = _get_cover_image(article_data.get("category", "skincare"))
            generated.append(article_data)

    # 3. Ingredient spotlight (rotate through list)
    if len(generated) < count:
        ingredient = SPOTLIGHT_INGREDIENTS[day_of_year % len(SPOTLIGHT_INGREDIENTS)]
        article_data = await generate_blog_article(
            article_type="ingredient_spotlight",
            context_data=ingredient,
        )
        if article_data:
            article_data["data_source"] = "ingredient_research"
            article_data["cover_image_url"] = _get_cover_image("ingredients")
            generated.append(article_data)

    # Save all to database
    saved = []
    for article in generated:
        result = _save_article(db, article)
        if result:
            saved.append(result)

    return saved


def _save_article(db: Session, article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Save a generated article to the Blog table with cover image."""
    try:
        slug = article.get("slug", f"article-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}")

        # Ensure unique slug
        existing = db.query(Blog).filter(Blog.slug == slug).first()
        if existing:
            slug = f"{slug}-{datetime.utcnow().strftime('%H%M%S')}"

        blog = Blog(
            title=article.get("title", "Untitled"),
            slug=slug,
            excerpt=article.get("excerpt", ""),
            content=article.get("content", ""),
            cover_image_url=article.get("cover_image_url", _get_cover_image("skincare")),
            category=article.get("category", "skincare"),
            tags=article.get("tags", []),
            read_time_min=article.get("read_time_min", 5),
            published=True,
            published_at=datetime.utcnow(),
        )
        db.add(blog)
        db.commit()
        db.refresh(blog)

        logger.info("Saved blog article: %s (cover: %s)", blog.title, blog.cover_image_url)
        return {
            "id": blog.id,
            "title": blog.title,
            "slug": blog.slug,
            "category": blog.category,
            "cover_image_url": blog.cover_image_url,
            "data_source": article.get("data_source"),
        }
    except Exception as e:
        logger.warning("Failed to save article: %s", e)
        try:
            db.rollback()
        except Exception:
            pass
        return None
