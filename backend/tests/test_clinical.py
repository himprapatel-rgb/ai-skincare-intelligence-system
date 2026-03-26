# Tests for Clinical Intelligence endpoints (Sprint 5)
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status


class TestClinicalAlerts:
    """Test skin alerts endpoints."""

    def test_get_alerts(self, client, auth_headers):
        """GET /api/v1/clinical/alerts returns alert list."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.check_skin_alerts"
        ) as mock_alerts:
            mock_alerts.return_value = []

            response = client.get(
                "/api/v1/clinical/alerts",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "data" in data
            assert isinstance(data["data"], list)
            assert data["total"] == 0

    def test_dismiss_alert(self, client, auth_headers):
        """POST /api/v1/clinical/alerts/{id}/dismiss returns 204."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.dismiss_alert"
        ) as mock_dismiss:
            mock_dismiss.return_value = True

            response = client.post(
                "/api/v1/clinical/alerts/1/dismiss",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_dismiss_alert_not_found(self, client, auth_headers):
        """POST /api/v1/clinical/alerts/{id}/dismiss returns 404 when not found."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.dismiss_alert"
        ) as mock_dismiss:
            mock_dismiss.return_value = False

            response = client.post(
                "/api/v1/clinical/alerts/999/dismiss",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_404_NOT_FOUND


class TestClinicalIngredientCheck:
    """Test ingredient interaction check endpoint."""

    def test_ingredient_check(self, client, auth_headers):
        """POST /api/v1/clinical/ingredient-check returns interaction results."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.check_ingredient_interactions"
        ) as mock_check:
            mock_check.return_value = {
                "conflicts": [],
                "warnings": [],
                "synergies": [],
            }

            response = client.post(
                "/api/v1/clinical/ingredient-check",
                json={"ingredients": ["niacinamide", "vitamin_c"]},
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["safe"] is True
            assert data["total_checked"] == 2


class TestClinicalTrends:
    """Test skin health trends endpoint."""

    def test_trends(self, client, auth_headers):
        """GET /api/v1/clinical/trends returns trend analysis."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.analyze_trends"
        ) as mock_trends:
            mock_trends.return_value = {
                "data_points": [],
                "period_days": 30,
                "trend_direction": "stable",
                "average_score": None,
                "score_change": None,
                "insights": ["Not enough data for trend analysis."],
            }

            response = client.get(
                "/api/v1/clinical/trends",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "trend_direction" in data
            assert "period_days" in data


class TestClinicalBenchmark:
    """Test comparative benchmarking endpoint."""

    def test_benchmark(self, client, auth_headers):
        """GET /api/v1/clinical/benchmark returns benchmark data."""
        with patch(
            "app.services.clinical_insights_service.clinical_insights_service.comparative_benchmark"
        ) as mock_bench:
            mock_bench.return_value = {
                "overall_percentile": 65.0,
                "category_percentiles": {},
                "total_users_compared": 100,
                "skin_type": "combination",
                "age_group": "25-34",
                "insights": ["Performing above average."],
            }

            response = client.get(
                "/api/v1/clinical/benchmark",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "overall_percentile" in data
            assert "total_users_compared" in data
