"""Print public schema table names using DATABASE_URL from the environment (e.g. railway run)."""
import os
import sys

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url


def main() -> int:
    # From local machine: Railway Postgres service exposes DATABASE_PUBLIC_URL (proxy host).
    # DATABASE_URL often uses *.railway.internal and only works inside Railway's network.
    url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if not url:
        print("Set DATABASE_PUBLIC_URL or DATABASE_URL.", file=sys.stderr)
        return 1

    # Railway / cloud Postgres often requires SSL on public proxy URLs
    u = make_url(url)
    connect_args: dict = {}
    q = dict(u.query) if u.query else {}
    if u.host and ("rlwy.net" in u.host.lower() or "proxy.rlwy.net" in u.host.lower()):
        q.setdefault("sslmode", "require")
    if q:
        u = u.set(query=q)
    engine = create_engine(u, connect_args=connect_args, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print(f"Connection failed: {exc}", file=sys.stderr)
        return 1

    insp = inspect(engine)
    names = insp.get_table_names(schema="public")
    for t in sorted(names):
        print(t)
    print(f"\nTotal: {len(names)} tables (schema public)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
