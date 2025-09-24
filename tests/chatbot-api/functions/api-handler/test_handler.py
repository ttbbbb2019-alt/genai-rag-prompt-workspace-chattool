import pytest
import sys
import os
from unittest.mock import Mock, patch

# Add the handler path to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../lib/chatbot-api/functions/api-handler'))


class TestMainHandler:
    @patch('index.app')
    def test_handler_success(self, mock_app):
        """Test successful handler execution"""
        # Import here to avoid module loading issues
        from index import handler
        
        event = {
            "info": {"fieldName": "health"},
            "arguments": {},
            "identity": {"sub": "test-user"}
        }
        context = Mock()
        
        mock_app.resolve.return_value = {"data": True}
        result = handler(event, context)
        assert result == {"data": True}
        mock_app.resolve.assert_called_once_with(event, context)

    @patch('index.app')
    def test_handler_validation_error(self, mock_app):
        """Test handler with validation error"""
        from pydantic import ValidationError
        from index import handler
        
        event = {
            "info": {"fieldName": "invalid"},
            "arguments": {"invalid": "data"},
            "identity": {"sub": "test-user"}
        }
        context = Mock()
        
        mock_app.resolve.side_effect = ValidationError.from_exception_data(
            "TestModel", [{"type": "missing", "loc": ("field",), "msg": "Field required"}]
        )
        
        with pytest.raises(ValueError, match="Invalid request"):
            handler(event, context)

    @patch('index.app')
    def test_handler_runtime_error(self, mock_app):
        """Test handler with unexpected error"""
        from index import handler
        
        event = {
            "info": {"fieldName": "test"},
            "arguments": {},
            "identity": {"sub": "test-user"}
        }
        context = Mock()
        
        mock_app.resolve.side_effect = Exception("Unexpected error")
        
        with pytest.raises(RuntimeError, match="Something went wrong"):
            handler(event, context)
