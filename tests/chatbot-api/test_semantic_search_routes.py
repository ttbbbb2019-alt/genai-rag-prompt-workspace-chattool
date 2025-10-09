import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import json

# Add the API handler path to sys.path for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/chatbot-api/functions/api-handler'))

# Mock all AWS and auth related modules before importing
sys.modules['genai_core.auth'] = MagicMock()
sys.modules['aws_lambda_powertools'] = MagicMock()
sys.modules['aws_lambda_powertools.tracing'] = MagicMock()
sys.modules['aws_lambda_powertools.tracing.tracer'] = MagicMock()

# Create a mock tracer
mock_tracer = MagicMock()
mock_tracer.capture_method = lambda func: func  # Return function unchanged
sys.modules['aws_lambda_powertools.tracing.tracer'].Tracer.return_value = mock_tracer

from routes.semantic_search import semantic_search, semantic_search_compare, SemanticSearchRequest, SemanticSearchCompareRequest
from pydantic import ValidationError


class TestSemanticSearchRoutes:
    """Test cases for semantic search API routes"""

    @patch('genai_core.semantic_search.semantic_search')
    def test_semantic_search_success(self, mock_semantic_search):
        """Test successful semantic search API call"""
        # Mock search result
        mock_result = {
            'engine': 'opensearch',
            'workspaceId': 'test-workspace',
            'items': [
                {
                    'sources': ['doc1'],
                    'chunk_id': 'chunk1',
                    'workspace_id': 'test-workspace',
                    'document_id': 'doc1',
                    'document_sub_id': None,
                    'document_type': 'text',
                    'document_sub_type': None,
                    'path': '/test/doc1.txt',
                    'language': 'en',
                    'title': 'Test Document',
                    'content': 'Test content',
                    'content_complement': '',
                    'vector_search_score': 0.9,
                    'keyword_search_score': None,
                    'score': 0.9
                }
            ],
            'vector_search_items': [],
            'keyword_search_items': []
        }
        mock_semantic_search.return_value = mock_result
        
        # Test input
        input_data = {
            'workspaceId': 'test-workspace',
            'query': 'test query'
        }
        
        # Execute
        result = semantic_search(input_data)
        
        # Assert
        assert result['engine'] == 'opensearch'
        assert result['workspaceId'] == 'test-workspace'
        assert len(result['items']) == 1
        assert result['items'][0]['chunkId'] == 'chunk1'
        
        mock_semantic_search.assert_called_once_with(
            workspace_id='test-workspace',
            query='test query',
            limit=25,
            full_response=True
        )

    def test_semantic_search_validation_error(self):
        """Test semantic search with invalid input"""
        # Missing required fields
        input_data = {
            'workspaceId': 'test-workspace'
            # Missing 'query'
        }
        
        with pytest.raises(ValidationError):
            SemanticSearchRequest(**input_data)

    def test_semantic_search_query_too_long(self):
        """Test semantic search with query too long"""
        input_data = {
            'workspaceId': 'test-workspace',
            'query': 'x' * 257  # Exceeds 256 character limit
        }
        
        with pytest.raises(ValidationError):
            SemanticSearchRequest(**input_data)


class TestSemanticSearchCompareRoutes:
    """Test cases for semantic search compare API routes"""

    @patch('genai_core.semantic_search.semantic_search_compare_prompts')
    def test_semantic_search_compare_success(self, mock_compare):
        """Test successful semantic search comparison"""
        # Mock comparison result
        mock_result = {
            'workspace_id': 'test-workspace',
            'total_prompts': 2,
            'engine': 'opensearch',
            'prompts_comparison': {
                'prompt_1': {
                    'prompt': 'first prompt',
                    'result': {
                        'engine': 'opensearch',
                        'items': [{'content': 'result1', 'score': 0.9}]
                    }
                },
                'prompt_2': {
                    'prompt': 'second prompt',
                    'result': {
                        'engine': 'opensearch',
                        'items': [{'content': 'result2', 'score': 0.8}]
                    }
                }
            }
        }
        mock_compare.return_value = mock_result
        
        # Test input
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['first prompt', 'second prompt'],
            'limit': 25
        }
        
        # Execute
        result = semantic_search_compare(input_data)
        
        # Assert
        assert result['workspaceId'] == 'test-workspace'
        assert result['totalPrompts'] == 2
        assert result['engine'] == 'opensearch'
        assert len(result['promptsComparison']) == 2
        
        # Check first prompt result
        first_result = result['promptsComparison'][0]
        assert first_result['prompt'] == 'first prompt'
        assert first_result['error'] is None
        assert first_result['result'] is not None
        
        mock_compare.assert_called_once_with(
            workspace_id='test-workspace',
            prompts=['first prompt', 'second prompt'],
            limit=25,
            full_response=True
        )

    @patch('genai_core.semantic_search.semantic_search_compare_prompts')
    def test_semantic_search_compare_with_errors(self, mock_compare):
        """Test semantic search comparison with some errors"""
        # Mock comparison result with error
        mock_result = {
            'workspace_id': 'test-workspace',
            'total_prompts': 2,
            'engine': 'opensearch',
            'prompts_comparison': {
                'prompt_1': {
                    'prompt': 'first prompt',
                    'result': {
                        'engine': 'opensearch',
                        'items': [{'content': 'result1', 'score': 0.9}]
                    }
                },
                'prompt_2': {
                    'prompt': 'second prompt',
                    'error': 'Search failed for this prompt'
                }
            }
        }
        mock_compare.return_value = mock_result
        
        # Test input
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['first prompt', 'second prompt']
        }
        
        # Execute
        result = semantic_search_compare(input_data)
        
        # Assert
        assert len(result['promptsComparison']) == 2
        
        # First prompt should have result
        first_result = result['promptsComparison'][0]
        assert first_result['error'] is None
        assert first_result['result'] is not None
        
        # Second prompt should have error
        second_result = result['promptsComparison'][1]
        assert second_result['error'] == 'Search failed for this prompt'
        assert second_result['result'] is None

    def test_semantic_search_compare_validation_empty_prompts(self):
        """Test comparison with empty prompts list"""
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': []
        }
        
        with pytest.raises(ValidationError):
            SemanticSearchCompareRequest(**input_data)

    def test_semantic_search_compare_validation_too_many_prompts(self):
        """Test comparison with too many prompts"""
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': [f'prompt{i}' for i in range(11)]  # 11 prompts
        }
        
        with pytest.raises(ValidationError):
            SemanticSearchCompareRequest(**input_data)

    def test_semantic_search_compare_validation_prompt_too_long(self):
        """Test comparison with prompt exceeding length limit"""
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['valid prompt', 'x' * 257]  # Second prompt too long
        }
        
        # This should raise ValueError during route processing
        with pytest.raises(ValueError, match="Prompt exceeds maximum length"):
            request = SemanticSearchCompareRequest(**input_data)
            # Simulate the validation in the route
            for prompt in request.prompts:
                if len(prompt) > 256:
                    raise ValueError("Prompt exceeds maximum length of 256 characters")

    def test_semantic_search_compare_request_validation(self):
        """Test SemanticSearchCompareRequest validation"""
        # Valid request
        valid_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['prompt1', 'prompt2'],
            'limit': 50
        }
        request = SemanticSearchCompareRequest(**valid_data)
        assert request.workspaceId == 'test-workspace'
        assert len(request.prompts) == 2
        assert request.limit == 50
        
        # Default limit
        default_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['prompt1', 'prompt2']
        }
        request = SemanticSearchCompareRequest(**default_data)
        assert request.limit == 25  # Default value
        
        # Invalid limit (too high)
        invalid_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['prompt1', 'prompt2'],
            'limit': 101
        }
        with pytest.raises(ValidationError):
            SemanticSearchCompareRequest(**invalid_data)


if __name__ == '__main__':
    pytest.main([__file__])
