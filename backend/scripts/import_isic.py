#!/usr/bin/env python3
"""ISIC Archive Dataset Import Script

Downloads 25,000+ high-quality dermoscopic images from ISIC Archive.
Dataset: International Skin Imaging Collaboration (ISIC) Archive
License: CC BY-NC-SA
Target: High-quality dermoscopic images with masks & metadata
"""

import os
import sys
import json
import logging
import requests
import zipfile
from pathlib import Path
from typing import Dict, List, Optional
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
ML_DATA_DIR = Path(__file__).parent.parent / "ml" / "data"
RAW_DIR = ML_DATA_DIR / "raw" / "isic"
PROCESSED_DIR = ML_DATA_DIR / "processed" / "isic"

# ISIC API endpoints
ISIC_API_BASE = "https://isic-archive.com/api/v1"
ISIC_IMAGE_ENDPOINT = f"{ISIC_API_BASE}/image"

class ISICImporter:
    def __init__(self, max_images: int = 25000):
        self.max_images = max_images
        self.stats = {'downloaded': 0, 'errors': 0}
        self.session = requests.Session()
    
    def check_prerequisites(self) -> bool:
        """Check if required directories exist"""
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        return True
    
    def get_image_list(self, limit: int = None) -> List[Dict]:
        """Fetch list of images from ISIC API"""
        logger.info("Fetching image list from ISIC Archive...")
        
        limit = limit or self.max_images
        params = {
            'limit': limit,
            'offset': 0,
            'sort': 'name',
            'sortdir': 1
        }
        
        try:
            response = self.session.get(ISIC_IMAGE_ENDPOINT, params=params, timeout=30)
            response.raise_for_status()
            images = response.json()
            logger.info(f"Found {len(images)} images")
            return images
        except Exception as e:
            logger.error(f"Failed to fetch image list: {e}")
            return []
    
    def download_image(self, image_id: str, name: str) -> bool:
        """Download single image"""
        try:
            # Download image
            image_url = f"{ISIC_IMAGE_ENDPOINT}/{image_id}/download"
            response = self.session.get(image_url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Save image
            image_path = RAW_DIR / "images" / f"{name}.jpg"
            image_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(image_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            self.stats['downloaded'] += 1
            return True
        
        except Exception as e:
            logger.debug(f"Failed to download {image_id}: {e}")
            self.stats['errors'] += 1
            return False
    
    def download_metadata(self, image_id: str) -> Optional[Dict]:
        """Download image metadata"""
        try:
            metadata_url = f"{ISIC_IMAGE_ENDPOINT}/{image_id}"
            response = self.session.get(metadata_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.debug(f"Failed to download metadata for {image_id}: {e}")
            return None
    
    def batch_download(self, images: List[Dict]):
        """Download images in batches"""
        logger.info(f"Starting download of {len(images)} images...")
        logger.info("This may take several hours for large datasets")
        
        metadata_list = []
        
        for i, image_info in enumerate(images):
            image_id = image_info['_id']
            name = image_info.get('name', image_id)
            
            # Download image
            if self.download_image(image_id, name):
                # Download and save metadata
                metadata = self.download_metadata(image_id)
                if metadata:
                    metadata_list.append(metadata)
            
            # Progress update
            if (i + 1) % 100 == 0:
                logger.info(f"Downloaded {i + 1}/{len(images)} images...")
            
            # Rate limiting
            time.sleep(0.1)  # Be nice to the API
        
        # Save aggregated metadata
        metadata_path = RAW_DIR / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata_list, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")
    
    def create_dataset_info(self):
        """Create dataset information file"""
        dataset_info = {
            'dataset': 'ISIC Archive',
            'version': '1.0',
            'license': 'CC BY-NC-SA',
            'source': 'https://isic-archive.com',
            'total_images': self.stats['downloaded'],
            'download_errors': self.stats['errors'],
            'citation': 'International Skin Imaging Collaboration: Melanoma Project. https://isic-archive.com',
            'notes': 'High-quality dermoscopic images with clinical metadata'
        }
        
        info_path = PROCESSED_DIR / "dataset_info.json"
        with open(info_path, 'w') as f:
            json.dump(dataset_info, f, indent=2)
        
        logger.info(f"Dataset info saved: {info_path}")
    
    def run(self):
        """Main import process"""
        logger.info("Starting ISIC Archive dataset import...")
        logger.info(f"Target: {self.max_images} images")
        
        # Check prerequisites
        if not self.check_prerequisites():
            return
        
        # Get image list
        images = self.get_image_list()
        
        if not images:
            logger.error("No images found. Exiting.")
            return
        
        # Download images
        self.batch_download(images)
        
        # Create dataset info
        self.create_dataset_info()
        
        logger.info(f"""\nImport complete! ✅

Dataset location: {RAW_DIR}
Total images downloaded: {self.stats['downloaded']}
Errors: {self.stats['errors']}

Next steps:
1. Organize images into train/val/test splits
2. Process images for model training
3. Review metadata for Fitzpatrick types
        """)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Download ISIC Archive dataset')
    parser.add_argument('--max-images', type=int, default=25000,
                       help='Maximum number of images to download (default: 25000)')
    
    args = parser.parse_args()
    
    importer = ISICImporter(max_images=args.max_images)
    importer.run()
