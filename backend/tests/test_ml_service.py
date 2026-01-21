"""Tests for ML Inference Service."""
import pytest

from app.services.ml_service import MLInferenceService, get_ml_service


class TestMLInferenceService:
    """Test cases for MLInferenceService."""

    def test_init(self):
        """Test service initialization."""
        service = MLInferenceService()
        assert service.model_version == "stub-v1.0"
        assert service.model_loaded is False

    @pytest.mark.asyncio
    async def test_load_active_model(self):
        """Test loading the active model."""
        service = MLInferenceService()
        result = await service.load_active_model()
        assert result is True
        assert service.model_loaded is True

    def test_extract_features_basic(self):
        """Test basic feature extraction."""
        service = MLInferenceService()
        user_profile = {
            'skin_type': 'oily',
            'concerns': ['acne'],
            'sensitivities': []
        }
        product_data = {
            'ingredients': ['water', 'glycerin'],
            'category': 'moisturizer'
        }
        features = service.extract_features(user_profile, product_data)
        assert 'has_sensitive_ingredients' in features
        assert 'skin_type_match' in features
        assert 'ingredient_count' in features
        assert features['has_sensitive_ingredients'] is False
        assert features['ingredient_count'] == 2

    def test_extract_features_with_sensitive_ingredients(self):
        """Test feature extraction with sensitive ingredients."""
        service = MLInferenceService()
        user_profile = {'skin_type': 'sensitive', 'concerns': [], 'sensitivities': []}
        product_data = {'ingredients': ['fragrance', 'alcohol'], 'category': 'serum'}
        features = service.extract_features(user_profile, product_data)
        assert features['has_sensitive_ingredients'] is True

    @pytest.mark.asyncio
    async def test_predict_good_match(self):
        """Test prediction for a good product match."""
        service = MLInferenceService()
        user_profile = {
            'skin_type': 'normal',
            'concerns': ['hydration'],
            'sensitivities': []
        }
        product_data = {
            'ingredients': ['water', 'hyaluronic acid', 'glycerin'],
            'category': 'moisturizer'
        }
        result = await service.predict(user_profile, product_data)
        assert 'suitability_score' in result
        assert 'confidence' in result
        assert 'explanation' in result
        assert 'warnings' in result
        assert result['suitability_score'] >= 0.7

    @pytest.mark.asyncio
    async def test_predict_with_sensitivities(self):
        """Test prediction with user sensitivities."""
        service = MLInferenceService()
        user_profile = {
            'skin_type': 'sensitive',
            'concerns': [],
            'sensitivities': ['fragrance']
        }
        product_data = {
            'ingredients': ['water', 'fragrance'],
            'category': 'serum'
        }
        result = await service.predict(user_profile, product_data)
        assert len(result['warnings']) > 0
        assert any('fragrance' in w.lower() for w in result['warnings'])

    def test_get_model_info(self):
        """Test getting model information."""
        service = MLInferenceService()
        info = service.get_model_info()
        assert info['version'] == 'stub-v1.0'
        assert info['loaded'] is False
        assert info['type'] == 'rule-based-stub'
        assert info['ready_for_ml'] is True


class TestGetMLService:
    """Test cases for get_ml_service singleton."""

    def test_get_ml_service_returns_instance(self):
        """Test that get_ml_service returns an MLInferenceService instance."""
        service = get_ml_service()
        assert isinstance(service, MLInferenceService)

    def test_get_ml_service_singleton(self):
        """Test that get_ml_service returns the same instance."""
        service1 = get_ml_service()
        service2 = get_ml_service()
        assert service1 is service2
