import types
import pytest


def _make_response(json_data, status_code=200):
    class Resp:
        def __init__(self, data, status):
            self._data = data
            self.status_code = status

        def json(self):
            return self._data

        def raise_for_status(self):
            if not (200 <= self.status_code < 300):
                raise Exception(f"HTTP {self.status_code}")

    return Resp(json_data, status_code)


def test_chat_uses_api_key_and_parses(monkeypatch):
    # Patch requests.post to capture call and return a mock response
    called = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        called['url'] = url
        called['headers'] = headers
        called['json'] = json
        called['timeout'] = timeout
        return _make_response({"text": "Hello from GPTGPT"}, 200)

    monkeypatch.setattr('requests.post', fake_post)

    # Import here so the module reads current settings at runtime
    from app.services.gpt_service import GPTService

    # Provide a dummy API key
    svc = GPTService(api_key="test-key",
                     base_url="https://api.gptgpt.example/v1")
    result = svc.chat("Say hi")

    assert result == "Hello from GPTGPT"
    assert called['url'].endswith('/chat')
    assert 'Authorization' in called['headers']
    assert called['headers']['Authorization'] == 'Bearer test-key'


def test_no_api_key_raises(monkeypatch):
    # Ensure settings.GPTGPT_API_KEY is None to trigger error
    import importlib
    cfg = importlib.import_module('app.config')
    # Temporarily set to None
    orig = cfg.settings.GPTGPT_API_KEY
    cfg.settings.GPTGPT_API_KEY = None
    try:
        from app.services.gpt_service import GPTService
        with pytest.raises(RuntimeError):
            GPTService()
    finally:
        cfg.settings.GPTGPT_API_KEY = orig
