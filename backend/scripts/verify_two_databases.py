#!/usr/bin/env python3
"""
Verify that both main and product databases are configured and reachable.

Usage:
  # Against a running backend (e.g. Railway):
  python scripts/verify_two_databases.py --url https://YOUR-BACKEND.up.railway.app

  # Or set BASE_URL env:
  export BASE_URL=https://YOUR-BACKEND.up.railway.app
  python scripts/verify_two_databases.py

Exits 0 if both DBs report ok, 1 otherwise.
"""

import argparse
import os
import sys

try:
    import requests
except ImportError:
    requests = None


def main():
    base = os.getenv("BASE_URL", "").rstrip("/")
    parser = argparse.ArgumentParser(description="Verify both databases via /api/health")
    parser.add_argument("--url", default=base, help="Backend base URL (e.g. https://xxx.up.railway.app)")
    args = parser.parse_args()
    url = args.url.rstrip("/") if args.url else None

    if not url:
        print("Error: Set BASE_URL or pass --url", file=sys.stderr)
        sys.exit(1)

    health_url = f"{url}/api/health"
    catalog_health_url = f"{url}/api/v1/catalog/health"

    if not requests:
        print("Error: install requests: pip install requests", file=sys.stderr)
        sys.exit(1)

    ok = True

    # Main health (includes both DBs)
    try:
        r = requests.get(health_url, timeout=15)
        r.raise_for_status()
        data = r.json()
        checks = data.get("checks", {})
        main_db = checks.get("main_database", {})
        product_db = checks.get("product_database", {})

        if main_db.get("status") == "ok":
            print(f"Main database:     ok (latency {main_db.get('latency_ms', 0)}ms)")
        else:
            print(f"Main database:     {main_db.get('status', 'unknown')} {main_db.get('error', '')}", file=sys.stderr)
            ok = False

        if product_db.get("status") == "ok":
            separate = product_db.get("is_separate_db", False)
            label = "ok (separate DB)" if separate else "ok (same DB)"
            print(f"Product database:  {label} (latency {product_db.get('latency_ms', 0)}ms)")
        else:
            print(f"Product database:  {product_db.get('status', 'unknown')} {product_db.get('error', '')}", file=sys.stderr)
            ok = False
    except requests.RequestException as e:
        print(f"Health request failed: {e}", file=sys.stderr)
        ok = False

    # Catalog health
    try:
        r = requests.get(catalog_health_url, timeout=10)
        r.raise_for_status()
        data = r.json()
        status = data.get("status", "unknown")
        counts = data.get("counts", {})
        if status == "healthy":
            print(f"Catalog API:        healthy (products={counts.get('products', 0)}, ingredients={counts.get('ingredients', 0)}, brands={counts.get('brands', 0)})")
        else:
            print(f"Catalog API:        {status}", file=sys.stderr)
            ok = False
    except requests.RequestException as e:
        print(f"Catalog health request failed: {e}", file=sys.stderr)
        ok = False

    if ok:
        print("\nBoth databases are up and reachable.")
    else:
        print("\nOne or more checks failed.", file=sys.stderr)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
