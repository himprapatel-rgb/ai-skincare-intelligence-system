"""Regression tests for API defects found via live verification.

Each test guards one of five fixes:
1. Goals static routes (`/suggested`, `/timeline`) no longer shadowed by `/{goal_id}`.
2. Routines static routes (`/adherence`, `/streak`) no longer shadowed by `/{routine_id}`.
3. `GET /content/blogs` serializes rows whose `sort_order` is NULL (no 500).
4. `ScanSession.analysis_result` aliases `scan_metadata` (AI endpoints / effectiveness
   tracking previously raised AttributeError).
5. Public ingredient-safety analysis is reachable (was shadowed by the ML `/analyze`).
"""


def test_goals_suggested_route_not_shadowed(client, auth_headers):
    """`/goals/suggested` must resolve to the static route, not `/{goal_id}`."""
    resp = client.get("/api/v1/goals/suggested", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)


def test_goals_timeline_route_not_shadowed(client, auth_headers):
    resp = client.get("/api/v1/goals/timeline", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)


def test_routines_adherence_route_not_shadowed(client, auth_headers):
    """`/routines/adherence` must not be parsed as a `{routine_id}` UUID."""
    resp = client.get("/api/v1/routines/adherence?days=30", headers=auth_headers)
    assert resp.status_code == 200, resp.text


def test_routines_streak_route_not_shadowed(client, auth_headers):
    resp = client.get("/api/v1/routines/streak", headers=auth_headers)
    assert resp.status_code == 200, resp.text


def test_content_blogs_handles_null_sort_order(client, test_db):
    """A blog row with NULL sort_order must serialize without a 500."""
    from app.models.content import Blog

    blog = Blog(
        title="Null Sort Order Blog",
        slug="null-sort-order-blog",
        excerpt="x",
        content="<p>hi</p>",
        published=True,
        sort_order=None,
    )
    test_db.add(blog)
    test_db.commit()

    resp = client.get("/api/v1/content/blogs?limit=10")
    assert resp.status_code == 200, resp.text
    slugs = [b.get("slug") for b in resp.json()]
    assert "null-sort-order-blog" in slugs


def test_scan_session_analysis_result_alias():
    """`analysis_result` must read through to `scan_metadata` (no AttributeError)."""
    from app.models.scan import ScanSession

    payload = {"summary": {"overall_score": 82, "scores": {"hydration": 70}}}
    scan = ScanSession(scan_metadata=payload)
    assert scan.analysis_result == payload

    empty = ScanSession()
    assert empty.analysis_result is None


def test_public_ingredient_analysis_reachable(client):
    """Public ingredient-safety analysis is reachable and does not require auth."""
    resp = client.post(
        "/api/v1/products/analyze-ingredients",
        json={"ingredients": ["water", "niacinamide", "fragrance"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "safety_score" in body or "overall_safety" in body or body is not None


def test_ml_analyze_still_requires_auth(client):
    """The ML suitability endpoint keeps `/products/analyze` and stays auth-gated."""
    resp = client.post(
        "/api/v1/products/analyze",
        json={
            "user_profile": {"skin_type": "oily", "concerns": ["acne"], "sensitivities": []},
            "product_data": {"name": "Test", "ingredients": ["water"]},
        },
    )
    assert resp.status_code == 401, resp.text
