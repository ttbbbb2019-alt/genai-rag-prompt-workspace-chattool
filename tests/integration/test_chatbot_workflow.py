import pytest
import boto3
from moto import mock_dynamodb, mock_s3
from unittest.mock import patch, Mock


@mock_dynamodb
@mock_s3
class TestChatbotWorkflow:
    """Integration tests for complete chatbot workflows"""
    
    def setup_method(self):
        """Setup test environment"""
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.s3 = boto3.client('s3', region_name='us-east-1')
        
        # Create test tables
        self.sessions_table = self.dynamodb.create_table(
            TableName='SessionsTableName',
            KeySchema=[{'AttributeName': 'SessionId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'SessionId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        self.documents_table = self.dynamodb.create_table(
            TableName='DocumentTableName',
            KeySchema=[{'AttributeName': 'workspace_id', 'KeyType': 'HASH'},
                      {'AttributeName': 'document_id', 'KeyType': 'RANGE'}],
            AttributeDefinitions=[
                {'AttributeName': 'workspace_id', 'AttributeType': 'S'},
                {'AttributeName': 'document_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

    @patch('genai_core.bedrock.get_bedrock_client')
    def test_chat_session_creation(self, mock_bedrock):
        """Test creating a new chat session"""
        from routes.sessions import create_session
        
        session_data = {
            "user_id": "test-user",
            "title": "Test Session"
        }
        
        result = create_session(session_data)
        assert result["user_id"] == "test-user"
        assert result["title"] == "Test Session"
        assert "session_id" in result

    @patch('genai_core.bedrock.get_bedrock_client')
    def test_document_upload_workflow(self, mock_bedrock):
        """Test document upload and processing workflow"""
        from routes.documents import add_document
        
        # Create test bucket
        self.s3.create_bucket(Bucket='Bucket')
        
        document_data = {
            "workspace_id": "test-workspace",
            "document": {
                "name": "test.txt",
                "content": "Test document content"
            }
        }
        
        with patch('genai_core.documents.process_document') as mock_process:
            mock_process.return_value = {"status": "processed"}
            result = add_document(document_data)
            assert result["workspace_id"] == "test-workspace"

    def test_health_check_integration(self):
        """Test health check endpoint integration"""
        from routes.health import health
        
        result = health()
        assert result is True
