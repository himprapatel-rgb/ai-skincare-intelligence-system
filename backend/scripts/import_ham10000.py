#!/usr/bin/env python3
"""HAM10000 Dataset Import Script

Downloads and organizes 10,015 dermoscopic images for ML training.
Dataset: HAM10000 (Human Against Machine with 10000 training images)
License: CC BY-NC-SA 4.0
Target: Baseline dermoscopic lesion classification (7 categories)

Categories:
- nv: Melanocytic nevi
- mel: Melanoma
- bkl: Benign keratosis-like lesions
- bcc: Basal cell carcinoma
- akiec: Actinic keratoses
- vasc: Vascular lesions
- df: Dermatofibroma
"""

import os
import sys
import json
import logging
import zipfile
import shutil
from pathlib import Path
from typing import Dict, List
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
ML_DATA_DIR = Path(__file__).parent.parent / "ml" / "data"
RAW_DIR = ML_DATA_DIR / "raw" / "ham10000"
PROCESSED_DIR = ML_DATA_DIR / "processed" / "ham10000"

# Dataset will be downloaded via Kaggle API
# Command: kaggle datasets download -d kmader/skin-cancer-mnist-ham10000

class HAM10000Importer:
    def __init__(self):
        self.stats = {'images': 0, 'train': 0, 'val': 0, 'test': 0}
        self.categories = ['nv', 'mel', 'bkl', 'bcc', 'akiec', 'vasc', 'df']
    
    def check_kaggle_setup(self) -> bool:
        """Check if Kaggle API is configured"""
        kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
        
        if not kaggle_json.exists():
            logger.error(f"""\nKaggle API not configured!
            
Please set up Kaggle API:
1. Go to https://www.kaggle.com/settings/account
2. Click 'Create New API Token' to download kaggle.json
3. Place it at: {kaggle_json}
4. Run: chmod 600 {kaggle_json}
5. Re-run this script
            """)
            return False
        
        try:
            import kaggle
            return True
        except ImportError:
            logger.error("Kaggle package not installed. Run: pip install kaggle")
            return False
    
    def download_dataset(self) -> bool:
        """Download HAM10000 via Kaggle API"""
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        
        logger.info("Downloading HAM10000 dataset from Kaggle...")
        logger.info("This may take 10-15 minutes (~2.5 GB)")
        
        try:
            import kaggle
            kaggle.api.dataset_download_files(
                'kmader/skin-cancer-mnist-ham10000',
                path=str(RAW_DIR),
                unzip=True
            )
            logger.info(f"Downloaded to {RAW_DIR}")
            return True
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return False
    
    def organize_dataset(self):
        """Organize images into train/val/test splits"""
        logger.info("Organizing dataset into train/val/test splits...")
        
        # Load metadata
        metadata_path = RAW_DIR / "HAM10000_metadata.csv"
        if not metadata_path.exists():
            logger.error(f"Metadata not found: {metadata_path}")
            return
        
        df = pd.read_csv(metadata_path)
        
        # Create split directories
        for split in ['train', 'val', 'test']:
            for category in self.categories:
                split_dir = PROCESSED_DIR / split / category
                split_dir.mkdir(parents=True, exist_ok=True)
        
        # Split data: 70% train, 15% val, 15% test
        from sklearn.model_selection import train_test_split
        
        train_df, temp_df = train_test_split(df, test_size=0.3, stratify=df['dx'], random_state=42)
        val_df, test_df = train_test_split(temp_df, test_size=0.5, stratify=temp_df['dx'], random_state=42)
        
        # Copy images to respective directories
        self._copy_images(train_df, 'train')
        self._copy_images(val_df, 'val')
        self._copy_images(test_df, 'test')
        
        logger.info(f"Dataset organized: {self.stats}")
    
    def _copy_images(self, df: pd.DataFrame, split: str):
        """Copy images to split directory"""
        for _, row in df.iterrows():
            image_id = row['image_id']
            category = row['dx']
            
            # Find image file (could be in multiple parts)
            src_image = None
            for img_dir in ['HAM10000_images_part_1', 'HAM10000_images_part_2']:
                potential_path = RAW_DIR / img_dir / f"{image_id}.jpg"
                if potential_path.exists():
                    src_image = potential_path
                    break
            
            if not src_image:
                logger.warning(f"Image not found: {image_id}")
                continue
            
            # Copy to processed directory
            dst_path = PROCESSED_DIR / split / category / f"{image_id}.jpg"
            shutil.copy2(src_image, dst_path)
            
            self.stats['images'] += 1
            self.stats[split] += 1
    
    def create_metadata_json(self):
        """Create dataset metadata JSON"""
        metadata = {
            'dataset': 'HAM10000',
            'version': '1.0',
            'license': 'CC BY-NC-SA 4.0',
            'source': 'https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000',
            'categories': self.categories,
            'splits': self.stats,
            'citation': 'Tschandl P, Rosendahl C, Kittler H. The HAM10000 dataset, a large collection of multi-source dermatoscopic images of common pigmented skin lesions. Sci Data. 2018'
        }
        
        metadata_path = PROCESSED_DIR / "dataset_info.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved: {metadata_path}")
    
    def run(self):
        """Main import process"""
        logger.info("Starting HAM10000 dataset import...")
        
        # Check Kaggle setup
        if not self.check_kaggle_setup():
            return
        
        # Download if not exists
        if not (RAW_DIR / "HAM10000_metadata.csv").exists():
            if not self.download_dataset():
                return
        else:
            logger.info("Dataset already downloaded, skipping download...")
        
        # Organize dataset
        self.organize_dataset()
        
        # Create metadata
        self.create_metadata_json()
        
        logger.info(f"""\nImport complete! ✅

Dataset location: {PROCESSED_DIR}
Total images: {self.stats['images']}
Train: {self.stats['train']}
Val: {self.stats['val']}
Test: {self.stats['test']}

Next steps:
1. Review dataset splits
2. Start model training with backend/ml/train.py
        """)

if __name__ == '__main__':
    try:
        import sklearn
        import pandas as pd
    except ImportError:
        logger.error("Required packages missing. Run: pip install scikit-learn pandas")
        sys.exit(1)
    
    importer = HAM10000Importer()
    importer.run()
