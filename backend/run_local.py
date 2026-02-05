"""
Run Backend with Local SQLite Database
Quick start for local development without PostgreSQL
"""

import os
import sys
from pathlib import Path

# Set environment to use SQLite
os.environ['USE_SQLITE'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///./skincare_local.db'

print("=" * 80)
print("  Starting Backend with Local SQLite Database")
print("=" * 80)
print()
print("📂 Database: skincare_local.db (SQLite)")
print("🌐 Server: http://localhost:8000")
print("📚 API Docs: http://localhost:8000/api/docs")
print()
print("✅ No PostgreSQL required!")
print()
print("Press Ctrl+C to stop...")
print("=" * 80)
print()

# Run uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
