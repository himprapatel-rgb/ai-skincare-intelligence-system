"""
Content models: blogs, videos, news.
Managed by admin; displayed on public pages.
"""
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Blog(Base):
    """Blog post for /blog page."""

    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    read_time_min = Column(Integer, default=5)
    category = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)
    view_count = Column(Integer, default=0)
    published = Column(Boolean, default=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Video(Base):
    """Video for /tutorials page."""

    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=False)  # YouTube, Vimeo, or self-hosted
    thumbnail_url = Column(String(500), nullable=True)
    duration_sec = Column(Integer, nullable=True)
    difficulty = Column(String(50), default="Beginner")  # Beginner, Intermediate, Advanced
    published = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NewsItem(Base):
    """News/announcement for homepage or news section."""

    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    link_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    published = Column(Boolean, default=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
