"""Schemas for blogs, videos, news."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# Blog
class BlogBase(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    read_time_min: int = 5
    published: bool = True
    published_at: Optional[datetime] = None
    sort_order: int = 0


class BlogCreate(BlogBase):
    pass


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    read_time_min: Optional[int] = None
    published: Optional[bool] = None
    published_at: Optional[datetime] = None
    sort_order: Optional[int] = None


class BlogResponse(BlogBase):
    id: int
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    view_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Video
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    duration_sec: Optional[int] = None
    difficulty: str = "Beginner"
    published: bool = True
    sort_order: int = 0


class VideoCreate(VideoBase):
    pass


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_sec: Optional[int] = None
    difficulty: Optional[str] = None
    published: Optional[bool] = None
    sort_order: Optional[int] = None


class VideoResponse(VideoBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# News
class NewsBase(BaseModel):
    title: str
    body: Optional[str] = None
    link_url: Optional[str] = None
    is_featured: bool = False
    published: bool = True
    published_at: Optional[datetime] = None
    sort_order: int = 0


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    link_url: Optional[str] = None
    is_featured: Optional[bool] = None
    published: Optional[bool] = None
    published_at: Optional[datetime] = None
    sort_order: Optional[int] = None


class NewsResponse(NewsBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
