import pytest
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add paths for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/shared/layers/python-sdk/python'))
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

import genai_core.semantic_search
from routes.semantic_search import semantic_search, semantic_search_compare


class TestSemanticSearchIntegration:
    """Integration tests for semantic search functionality"""

    @patch('genai_core.workspaces.get_workspace')
    @patch('genai_core.opensearch.query_workspace_open_search')
    def test_end_to_end_single_search(self, mock_opensearch_query, mock_get_workspace):
        """Test end-to-end single semantic search flow"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock search result from OpenSearch
        mock_opensearch_result = {
            'engine': 'opensearch',
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
                    'content': 'This is test content about machine learning',
                    'content_complement': '',
                    'vector_search_score': 0.95,
                    'keyword_search_score': None,
                    'score': 0.95
                }
            ],
            'vector_search_items': [],
            'keyword_search_items': []
        }
        mock_opensearch_query.return_value = mock_opensearch_result
        
        # Test API route
        input_data = {
            'workspaceId': 'test-workspace',
            'query': 'machine learning algorithms'
        }
        
        result = semantic_search(input_data)
        
        # Verify the complete flow
        assert result['engine'] == 'opensearch'
        assert result['workspaceId'] == 'test-workspace'
        assert len(result['items']) == 1
        
        item = result['items'][0]
        assert item['chunkId'] == 'chunk1'
        assert item['content'] == 'This is test content about machine learning'
        assert item['vectorSearchScore'] == 0.95
        
        # Verify core function was called correctly
        mock_opensearch_query.assert_called_once_with(
            'test-workspace', mock_workspace, 'machine learning algorithms', 25, True
        )

    @patch('genai_core.workspaces.get_workspace')
    @patch('genai_core.semantic_search.semantic_search')
    def test_end_to_end_comparison_search(self, mock_semantic_search, mock_get_workspace):
        """Test end-to-end semantic search comparison flow"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock search results for different prompts
        search_results = [
            {
                'engine': 'opensearch',
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
                        'title': 'ML Basics',
                        'content': 'Machine learning fundamentals',
                        'content_complement': '',
                        'vector_search_score': 0.92,
                        'keyword_search_score': None,
                        'score': 0.92
                    }
                ]
            },
            {
                'engine': 'opensearch',
                'items': [
                    {
                        'sources': ['doc2'],
                        'chunk_id': 'chunk2',
                        'workspace_id': 'test-workspace',
                        'document_id': 'doc2',
                        'document_sub_id': None,
                        'document_type': 'text',
                        'document_sub_type': None,
                        'path': '/test/doc2.txt',
                        'language': 'en',
                        'title': 'AI Overview',
                        'content': 'Artificial intelligence concepts',
                        'content_complement': '',
                        'vector_search_score': 0.88,
                        'keyword_search_score': None,
                        'score': 0.88
                    }
                ]
            }
        ]
        
        mock_semantic_search.side_effect = search_results
        
        # Test comparison API route
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['machine learning basics', 'artificial intelligence overview'],
            'limit': 25
        }
        
        result = semantic_search_compare(input_data)
        
        # Verify the complete comparison flow
        assert result['workspaceId'] == 'test-workspace'
        assert result['totalPrompts'] == 2
        assert result['engine'] == 'opensearch'
        assert len(result['promptsComparison']) == 2
        
        # Check first prompt result
        first_result = result['promptsComparison'][0]
        assert first_result['prompt'] == 'machine learning basics'
        assert first_result['error'] is None
        assert first_result['result'] is not None
        assert len(first_result['result']['items']) == 1
        assert first_result['result']['items'][0]['content'] == 'Machine learning fundamentals'
        
        # Check second prompt result
        second_result = result['promptsComparison'][1]
        assert second_result['prompt'] == 'artificial intelligence overview'
        assert second_result['error'] is None
        assert second_result['result'] is not None
        assert len(second_result['result']['items']) == 1
        assert second_result['result']['items'][0]['content'] == 'Artificial intelligence concepts'
        
        # Verify semantic_search was called for each prompt
        assert mock_semantic_search.call_count == 2

    @patch('genai_core.workspaces.get_workspace')
    @patch('genai_core.semantic_search.semantic_search')
    def test_comparison_with_mixed_results(self, mock_semantic_search, mock_get_workspace):
        """Test comparison where some prompts succeed and others fail"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock mixed results - first succeeds, second fails, third succeeds
        def side_effect(workspace_id, query, limit, full_response):
            if query == 'successful query 1':
                return {
                    'engine': 'opensearch',
                    'items': [{'content': 'Success 1', 'score': 0.9}]
                }
            elif query == 'failing query':
                raise Exception("Search engine error")
            elif query == 'successful query 2':
                return {
                    'engine': 'opensearch',
                    'items': [{'content': 'Success 2', 'score': 0.8}]
                }
        
        mock_semantic_search.side_effect = side_effect
        
        # Test comparison with mixed results
        input_data = {
            'workspaceId': 'test-workspace',
            'prompts': ['successful query 1', 'failing query', 'successful query 2'],
            'limit': 25
        }
        
        result = semantic_search_compare(input_data)
        
        # Verify results
        assert result['totalPrompts'] == 3
        assert len(result['promptsComparison']) == 3
        
        # First prompt - success
        assert result['promptsComparison'][0]['error'] is None
        assert result['promptsComparison'][0]['result'] is not None
        
        # Second prompt - error
        assert result['promptsComparison'][1]['error'] == "Search engine error"
        assert result['promptsComparison'][1]['result'] is None
        
        # Third prompt - success
        assert result['promptsComparison'][2]['error'] is None
        assert result['promptsComparison'][2]['result'] is not None

    @patch('genai_core.workspaces.get_workspace')
    def test_workspace_validation_flow(self, mock_get_workspace):
        """Test workspace validation in the complete flow"""
        # Test with non-existent workspace
        mock_get_workspace.return_value = None
        
        input_data = {
            'workspaceId': 'non-existent-workspace',
            'query': 'test query'
        }
        
        with pytest.raises(Exception):  # Should raise CommonError
            semantic_search(input_data)
        
        # Test with workspace not ready
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'creating',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        input_data = {
            'workspaceId': 'test-workspace',
            'query': 'test query'
        }
        
        with pytest.raises(Exception):  # Should raise CommonError
            semantic_search(input_data)


if __name__ == '__main__':
    pytest.main([__file__])
