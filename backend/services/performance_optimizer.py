# Performance Optimization Service for Sprint 2 Phase 3
import asyncio
import functools
import time
from typing import Dict, Any, Callable, Optional
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)


class PerformanceOptimizer:
    """
    Service for performance optimizations including caching,
    image optimization, and async processing
    """
    
    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, float] = {}
        self.cache_ttl = 3600  # 1 hour default TTL
    
    def cache_result(self, ttl: int = None):
        """
        Decorator to cache function results
        
        Usage:
            @performance_optimizer.cache_result(ttl=300)
            async def expensive_operation(param):
                return result
        """
        def decorator(func: Callable):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                # Check if cached and not expired
                if cache_key in self._cache:
                    timestamp = self._cache_timestamps.get(cache_key, 0)
                    age = time.time() - timestamp
                    cache_ttl = ttl or self.cache_ttl
                    
                    if age < cache_ttl:
                        logger.debug(f"Cache hit for {func.__name__}")
                        return self._cache[cache_key]
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                self._cache[cache_key] = result
                self._cache_timestamps[cache_key] = time.time()
                logger.debug(f"Cached result for {func.__name__}")
                return result
            
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                if cache_key in self._cache:
                    timestamp = self._cache_timestamps.get(cache_key, 0)
                    age = time.time() - timestamp
                    cache_ttl = ttl or self.cache_ttl
                    
                    if age < cache_ttl:
                        logger.debug(f"Cache hit for {func.__name__}")
                        return self._cache[cache_key]
                
                result = func(*args, **kwargs)
                self._cache[cache_key] = result
                self._cache_timestamps[cache_key] = time.time()
                return result
            
            # Return appropriate wrapper based on function type
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper
        
        return decorator
    
    @staticmethod
    def optimize_image(
        image_data: bytes,
        max_width: int = 1024,
        max_height: int = 1024,
        quality: int = 85
    ) -> bytes:
        """
        Optimize image size and quality for faster processing
        
        Args:
            image_data: Raw image bytes
            max_width: Maximum width in pixels
            max_height: Maximum height in pixels
            quality: JPEG quality (1-100)
        
        Returns:
            Optimized image bytes
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background
            
            # Resize if too large
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                logger.debug(f"Resized image from original to {image.size}")
            
            # Save optimized
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            optimized_data = output.getvalue()
            
            # Log optimization results
            original_size = len(image_data)
            optimized_size = len(optimized_data)
            reduction = ((original_size - optimized_size) / original_size) * 100
            logger.info(f"Image optimized: {original_size} -> {optimized_size} bytes ({reduction:.1f}% reduction)")
            
            return optimized_data
        
        except Exception as e:
            logger.error(f"Image optimization failed: {e}")
            return image_data  # Return original on error
    
    @staticmethod
    async def batch_process(
        items: list,
        process_func: Callable,
        batch_size: int = 10,
        max_concurrent: int = 5
    ) -> list:
        """
        Process items in batches with concurrency control
        
        Args:
            items: List of items to process
            process_func: Async function to process each item
            batch_size: Number of items per batch
            max_concurrent: Maximum concurrent tasks
        
        Returns:
            List of results
        """
        results = []
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_with_semaphore(item):
            async with semaphore:
                return await process_func(item)
        
        # Process in batches
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = await asyncio.gather(
                *[process_with_semaphore(item) for item in batch],
                return_exceptions=True
            )
            results.extend(batch_results)
        
        return results
    
    def clear_cache(self, pattern: Optional[str] = None):
        """
        Clear cache entries
        
        Args:
            pattern: If provided, only clear keys containing this pattern
        """
        if pattern:
            keys_to_delete = [
                key for key in self._cache.keys()
                if pattern in key
            ]
            for key in keys_to_delete:
                del self._cache[key]
                del self._cache_timestamps[key]
            logger.info(f"Cleared {len(keys_to_delete)} cache entries matching '{pattern}'")
        else:
            self._cache.clear()
            self._cache_timestamps.clear()
            logger.info("Cleared all cache entries")


# Global instance
performance_optimizer = PerformanceOptimizer()
