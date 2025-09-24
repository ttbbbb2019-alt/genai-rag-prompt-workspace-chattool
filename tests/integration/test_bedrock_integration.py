import pytest
from unittest.mock import patch, Mock
import boto3
from moto import mock_bedrock


class TestBedrockIntegration:
    """Integration tests for Bedrock model interactions"""
    
    @patch('boto3.client')
    def test_bedrock_client_initialization(self, mock_boto_client):
        """Test Bedrock client setup"""
        from genai_core.bedrock import get_bedrock_client
        
        mock_client = Mock()
        mock_boto_client.return_value = mock_client
        
        client = get_bedrock_client()
        mock_boto_client.assert_called_with('bedrock-runtime', region_name='us-east-1')
        assert client == mock_client

    @patch('genai_core.bedrock.get_bedrock_client')
    def test_model_invocation_success(self, mock_get_client):
        """Test successful model invocation"""
        mock_client = Mock()
        mock_client.invoke_model.return_value = {
            'body': Mock(read=lambda: b'{"completion": "Test response"}')
        }
        mock_get_client.return_value = mock_client
        
        from genai_core.bedrock import invoke_model
        
        response = invoke_model("anthropic.claude-v2", "Test prompt")
        assert "completion" in response

    @patch('genai_core.bedrock.get_bedrock_client')
    def test_model_invocation_permission_error(self, mock_get_client):
        """Test model invocation with permission error"""
        from botocore.exceptions import ClientError
        
        mock_client = Mock()
        mock_client.invoke_model.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Access denied'}},
            'InvokeModel'
        )
        mock_get_client.return_value = mock_client
        
        from genai_core.bedrock import invoke_model
        
        with pytest.raises(ClientError):
            invoke_model("anthropic.claude-v2", "Test prompt")

    @pytest.mark.skipif(
        True,  # Skip until Bedrock access is approved
        reason="Requires Bedrock access approval - see conversation summary"
    )
    def test_live_bedrock_integration(self):
        """Test actual Bedrock integration (requires approval)"""
        # This test will be enabled once Bedrock access is granted
        pass
