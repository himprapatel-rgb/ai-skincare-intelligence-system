#!/usr/bin/env python3
"""
Database Seeding Script for AI Skincare Intelligence System

This script imports all data sources into the production database.
It can be run manually via Railway CLI or as a cron job.

Usage:
    python seed_database.py              # Run all imports
    python seed_database.py --only cosing  # Run only CosIng import
    python seed_database.py --skip ml      # Skip ML datasets

Author: Himanshu Prapatel
Date: December 10, 2025
"""

import asyncio
import sys
import os
import argparse
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


class DatabaseSeeder:
    """Orchestrates database seeding operations"""
    
    def __init__(self, skip=None, only=None):
        self.skip = skip or []
        self.only = only
        self.results = {}
    
    async def seed_all(self):
        """Run all data import scripts sequentially"""
        
        print("=" * 80)
        print("🌱 AI Skincare Intelligence System - Database Seeding")
        print("=" * 80)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Define all imports with metadata
        imports = [
            {
                "name": "CosIng Ingredients",
                "module": "import_cosing",
                "description": "26k+ INCI ingredient names",
                "category": "core",
                "priority": 1
            },
            {
                "name": "CSCP Hazards",
                "module": "import_cscp",
                "description": "10k+ hazard classifications",
                "category": "core",
                "priority": 2
            },
            {
                "name": "Open Beauty Facts Products",
                "module": "import_open_beauty_facts",
                "description": "100k+ cosmetic products",
                "category": "products",
                "priority": 3
            },
            {
                "name": "Sephora Products",
                "module": "import_sephora",
                "description": "5k+ branded products with pricing",
                "category": "products",
                "priority": 4
            },
            {
                "name": "HAM10000 ML Dataset",
                "module": "import_ham10000",
                "description": "10k dermoscopic skin images",
                "category": "ml",
                "priority": 5
            },
            {
                "name": "ISIC Archive ML Dataset",
                "module": "import_isic",
                "description": "25k+ dermoscopic images",
                "category": "ml",
                "priority": 6
            },
        ]
        
        # Filter imports based on skip/only flags
        if self.only:
            imports = [i for i in imports if i["category"] == self.only or i["module"] == self.only]
        if self.skip:
            imports = [i for i in imports if i["category"] not in self.skip]
        
        print(f"📋 Importing {len(imports)} dataset(s)\n")
        
        # Execute imports sequentially
        for idx, import_def in enumerate(imports, 1):
            await self._run_import(idx, len(imports), import_def)
        
        # Print summary
        self._print_summary()
    
    async def _run_import(self, idx, total, import_def):
        """Run a single import script"""
        
        name = import_def["name"]
        module_name = import_def["module"]
        description = import_def["description"]
        
        print(f"[{idx}/{total}] 📦 {name}")
        print(f"      Description: {description}")
        print(f"      Module: {module_name}.py")
        
        start_time = datetime.now()
        
        try:
            # Dynamically import the module
            module = __import__(module_name, fromlist=[''])
            
            # Look for main() or run() function
            if hasattr(module, 'main'):
                if asyncio.iscoroutinefunction(module.main):
                    await module.main()
                else:
                    module.main()
            elif hasattr(module, 'run'):
                if asyncio.iscoroutinefunction(module.run):
                    await module.run()
                else:
                    module.run()
            else:
                raise AttributeError(f"Module {module_name} has no main() or run() function")
            
            duration = (datetime.now() - start_time).total_seconds()
            
            self.results[name] = {
                "status": "success",
                "duration": duration
            }
            
            print(f"      ✅ Success ({duration:.1f}s)\n")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            
            self.results[name] = {
                "status": "error",
                "error": str(e),
                "duration": duration
            }
            
            print(f"      ❌ Error: {e} ({duration:.1f}s)")
            print(f"      Continuing with next dataset...\n")
    
    def _print_summary(self):
        """Print execution summary"""
        
        print("=" * 80)
        print("📊 Seeding Summary")
        print("=" * 80)
        
        success_count = sum(1 for r in self.results.values() if r["status"] == "success")
        error_count = sum(1 for r in self.results.values() if r["status"] == "error")
        total_duration = sum(r["duration"] for r in self.results.values())
        
        print(f"\n✅ Successful: {success_count}")
        print(f"❌ Failed: {error_count}")
        print(f"⏱️  Total duration: {total_duration:.1f}s\n")
        
        if error_count > 0:
            print("Failed imports:")
            for name, result in self.results.items():
                if result["status"] == "error":
                    print(f"  - {name}: {result['error']}")
            print()
        
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Exit with error code if any imports failed
        if error_count > 0:
            sys.exit(1)


def main():
    """Main entry point"""
    
    parser = argparse.ArgumentParser(
        description="Seed the AI Skincare Intelligence System database"
    )
    parser.add_argument(
        "--skip",
        nargs="+",
        choices=["core", "products", "ml"],
        help="Skip specific categories"
    )
    parser.add_argument(
        "--only",
        choices=["core", "products", "ml", "cosing", "cscp", "obf", "sephora", "ham10000", "isic"],
        help="Run only specific category or dataset"
    )
    
    args = parser.parse_args()
    
    seeder = DatabaseSeeder(skip=args.skip, only=args.only)
    
    try:
        asyncio.run(seeder.seed_all())
    except KeyboardInterrupt:
        print("\n\n⚠️  Seeding interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n💥 Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
