"""
Cloudflare R2 Storage Service

S3-compatible object storage for:
- Enhanced images
- 3D face models (.obj, .glb)
- Texture maps
- User scan history

Cost: $0.015/GB/month (first 10GB free)
"""

import os
import boto3
import httpx
from typing import Optional, BinaryIO
from dataclasses import dataclass
from datetime import datetime
import uuid

from app.config import settings


@dataclass
class UploadResult:
    """Result from file upload"""
    success: bool
    url: Optional[str] = None
    key: Optional[str] = None
    size_bytes: int = 0
    error: Optional[str] = None


class R2StorageService:
    """
    Cloudflare R2 storage for AI-generated assets.
    
    Buckets:
    - pellicura-images: Enhanced photos, backgrounds removed
    - pellicura-3d: 3D face models, textures
    - pellicura-scans: Original scan photos (temporary)
    """
    
    def __init__(
        self,
        account_id: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        bucket_name: Optional[str] = None
    ):
        """Initialize R2 client."""
        # Use Cloudflare account ID from settings (already configured)
        self.account_id = account_id or os.getenv("CLOUDFLARE_ACCOUNT_ID")
        self.access_key_id = access_key_id or settings.R2_ACCESS_KEY_ID or os.getenv("R2_ACCESS_KEY_ID")
        self.secret_access_key = secret_access_key or settings.R2_SECRET_ACCESS_KEY or os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = bucket_name or settings.R2_BUCKET_NAME
        
        # R2 endpoint
        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
        
        # Public URL for accessing files
        self.public_url_base = settings.R2_PUBLIC_URL or os.getenv(
            "R2_PUBLIC_URL", 
            f"https://pub-{self.account_id}.r2.dev"
        )
        
        self._client = None
    
    @property
    def client(self):
        """Get or create boto3 S3 client for R2."""
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                region_name="auto"
            )
        return self._client
    
    def _generate_key(self, user_id: str, category: str, filename: str) -> str:
        """Generate unique storage key."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        extension = filename.split(".")[-1] if "." in filename else "bin"
        return f"{category}/{user_id}/{timestamp}_{unique_id}.{extension}"
    
    async def upload_file(
        self,
        file_data: bytes,
        user_id: str,
        category: str = "images",
        filename: str = "file.png",
        content_type: str = "image/png",
        public: bool = True
    ) -> UploadResult:
        """
        Upload file to R2 storage.
        
        Categories:
        - images: Enhanced photos
        - backgrounds: Background-removed images
        - models: 3D face models (.obj, .glb)
        - textures: 3D texture maps
        - scans: Original scan photos
        """
        try:
            key = self._generate_key(user_id, category, filename)
            
            extra_args = {
                "ContentType": content_type,
            }
            if public:
                extra_args["ACL"] = "public-read"
            
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_data,
                **extra_args
            )
            
            url = f"{self.public_url_base}/{key}" if public else None
            
            return UploadResult(
                success=True,
                url=url,
                key=key,
                size_bytes=len(file_data)
            )
        except Exception as e:
            return UploadResult(
                success=False,
                error=str(e)
            )
    
    async def upload_from_url(
        self,
        source_url: str,
        user_id: str,
        category: str = "images",
        filename: str = "file.png"
    ) -> UploadResult:
        """Download from URL and upload to R2."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(source_url, follow_redirects=True)
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "application/octet-stream")
                
                return await self.upload_file(
                    file_data=response.content,
                    user_id=user_id,
                    category=category,
                    filename=filename,
                    content_type=content_type
                )
        except Exception as e:
            return UploadResult(
                success=False,
                error=str(e)
            )
    
    async def upload_3d_model(
        self,
        obj_data: bytes,
        texture_data: Optional[bytes],
        user_id: str,
        scan_id: str
    ) -> dict:
        """
        Upload 3D face model with texture.
        
        Returns URLs for:
        - model_url: .obj file
        - texture_url: texture image
        """
        results = {}
        
        # Upload OBJ model
        model_result = await self.upload_file(
            file_data=obj_data,
            user_id=user_id,
            category="models",
            filename=f"{scan_id}.obj",
            content_type="model/obj"
        )
        results["model"] = model_result
        
        # Upload texture if provided
        if texture_data:
            texture_result = await self.upload_file(
                file_data=texture_data,
                user_id=user_id,
                category="textures",
                filename=f"{scan_id}_texture.png",
                content_type="image/png"
            )
            results["texture"] = texture_result
        
        return results
    
    async def get_file_url(self, key: str, expires_in: int = 3600) -> str:
        """Get presigned URL for private file access."""
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=expires_in
        )
        return url
    
    async def delete_file(self, key: str) -> bool:
        """Delete file from storage."""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False
    
    async def list_user_files(
        self, 
        user_id: str, 
        category: Optional[str] = None,
        limit: int = 100
    ) -> list:
        """List all files for a user."""
        prefix = f"{category}/{user_id}/" if category else f"{user_id}/"
        
        response = self.client.list_objects_v2(
            Bucket=self.bucket_name,
            Prefix=prefix,
            MaxKeys=limit
        )
        
        files = []
        for obj in response.get("Contents", []):
            files.append({
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
                "url": f"{self.public_url_base}/{obj['Key']}"
            })
        
        return files


# Singleton instance
_storage: Optional[R2StorageService] = None


def get_r2_storage() -> R2StorageService:
    """Get or create R2 storage service instance."""
    global _storage
    if _storage is None:
        _storage = R2StorageService()
    return _storage
