"""Public content API: blogs, videos, news."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Blog, NewsItem, Video
from app.schemas.content_schemas import BlogResponse, NewsResponse, VideoResponse

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/blogs", response_model=List[BlogResponse])
def list_blogs(
    response: Response,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Public list of published blogs (cached for 5 min)."""
    response.headers["Cache-Control"] = "public, max-age=300"
    query = db.query(Blog).filter(Blog.published == True)
    total = query.count()
    items = (
        query
        .order_by(Blog.sort_order.asc(), Blog.published_at.desc().nullslast(), Blog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/blogs/{blog_id}", response_model=BlogResponse)
def get_blog(blog_id: int, response: Response, db: Session = Depends(get_db)):
    """Public blog by ID."""
    response.headers["Cache-Control"] = "public, max-age=300"
    blog = db.query(Blog).filter(Blog.id == blog_id, Blog.published == True).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


@router.get("/videos", response_model=List[VideoResponse])
def list_videos(
    response: Response,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Public list of published videos (cached for 5 min)."""
    response.headers["Cache-Control"] = "public, max-age=300"
    query = db.query(Video).filter(Video.published == True)
    total = query.count()
    items = (
        query
        .order_by(Video.sort_order.asc(), Video.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/news", response_model=List[NewsResponse])
def list_news(
    response: Response,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    featured_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Public list of published news items."""
    response.headers["Cache-Control"] = "public, max-age=300"
    query = db.query(NewsItem).filter(NewsItem.published == True)
    if featured_only:
        query = query.filter(NewsItem.is_featured == True)
    total = query.count()
    items = (
        query.order_by(NewsItem.sort_order.asc(), NewsItem.published_at.desc().nullslast(), NewsItem.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    response.headers["X-Total-Count"] = str(total)
    return items


# ===== Sprint 3 Endpoints =====


@router.get("/blogs/by-slug/{slug}", response_model=BlogResponse)
def get_blog_by_slug(slug: str, response: Response, db: Session = Depends(get_db)):
    """Get a published blog by its slug."""
    response.headers["Cache-Control"] = "public, max-age=300"
    blog = db.query(Blog).filter(Blog.slug == slug, Blog.published == True).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


@router.post("/blogs/{blog_id}/view")
def increment_blog_view(blog_id: int, db: Session = Depends(get_db)):
    """Increment the view count of a blog post."""
    blog = db.query(Blog).filter(Blog.id == blog_id, Blog.published == True).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    blog.view_count = (blog.view_count or 0) + 1
    db.commit()
    return {"blog_id": blog_id, "view_count": blog.view_count}
