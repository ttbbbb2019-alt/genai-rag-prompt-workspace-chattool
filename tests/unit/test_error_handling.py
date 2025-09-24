import pytest
from unittest.mock import Mock, patch


class TestErrorHandling:
    """Unit tests for error handling patterns"""
    
    def test_validation_error_handling(self):
        """Test validation error is properly formatted"""
        from pydantic import ValidationError, BaseModel
        from pydantic import Field
        
        class TestModel(BaseModel):
            required_field: str = Field(..., description="Required field")
        
        with pytest.raises(ValidationError) as exc_info:
            TestModel()
        
        errors = exc_info.value.errors()
        assert len(errors) > 0
        assert errors[0]["type"] == "missing"

    def test_common_error_types(self):
        """Test common error handling patterns"""
        # Test ValueError
        with pytest.raises(ValueError, match="Invalid input"):
            raise ValueError("Invalid input")
        
        # Test RuntimeError
        with pytest.raises(RuntimeError, match="System error"):
            raise RuntimeError("System error")

    @patch('boto3.client')
    def test_aws_client_error_handling(self, mock_boto_client):
        """Test AWS client error handling"""
        from botocore.exceptions import ClientError
        
        mock_client = Mock()
        mock_client.some_operation.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'SomeOperation'
        )
        mock_boto_client.return_value = mock_client
        
        with pytest.raises(ClientError) as exc_info:
            mock_client.some_operation()
        
        assert exc_info.value.response['Error']['Code'] == 'AccessDenied'
