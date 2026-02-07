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
    items = (
        db.query(Blog)
        .filter(Blog.published == True)
        .order_by(Blog.sort_order.asc(), Blog.published_at.desc().nullslast(), Blog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
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
    items = (
        db.query(Video)
        .filter(Video.published == True)
        .order_by(Video.sort_order.asc(), Video.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
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
    items = (
        query.order_by(NewsItem.sort_order.asc(), NewsItem.published_at.desc().nullslast(), NewsItem.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items
