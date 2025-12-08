from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ExternalProduct(BaseModel):
    id: str
    brand_name: Optional[str]
    product_name: Optional[str]
    barcode: Optional[str]
    category: Optional[str]
    image_url: Optional[str]
    ingredients: Optional[str]
