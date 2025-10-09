import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the genai_core path to sys.path for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/shared/layers/python-sdk/python'))

# Mock dependencies before importing
sys.modules['genai_core.opensearch'] = MagicMock()
sys.modules['genai_core.aurora'] = MagicMock()
sys.modules['genai_core.kendra'] = MagicMock()
sys.modules['genai_core.bedrock_kb'] = MagicMock()

import genai_core.semantic_search
import genai_core.types


class TestSemanticSearch:
    """Test cases for semantic search functionality"""

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_opensearch_success(self, mock_get_workspace):
        """Test successful semantic search with OpenSearch"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock search result
        mock_result = {
            'engine': 'opensearch',
            'items': [{'content': 'test content', 'score': 0.9}]
        }
        
        # Mock the opensearch module's query function
        sys.modules['genai_core.opensearch'].query_workspace_open_search.return_value = mock_result
        
        # Execute
        result = genai_core.semantic_search.semantic_search(
            workspace_id='test-workspace',
            query='test query',
            limit=5,
            full_response=True
        )
        
        # Assert
        assert result == mock_result
        mock_get_workspace.assert_called_once_with('test-workspace')
        sys.modules['genai_core.opensearch'].query_workspace_open_search.assert_called_once_with(
            'test-workspace', mock_workspace, 'test query', 5, True
        )

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_workspace_not_found(self, mock_get_workspace):
        """Test semantic search with non-existent workspace"""
        mock_get_workspace.return_value = None
        
        with pytest.raises(genai_core.types.CommonError, match="Workspace not found"):
            genai_core.semantic_search.semantic_search(
                workspace_id='non-existent',
                query='test query'
            )

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_workspace_not_ready(self, mock_get_workspace):
        """Test semantic search with workspace not ready"""
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'creating',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        with pytest.raises(genai_core.types.CommonError, match="Workspace is not ready"):
            genai_core.semantic_search.semantic_search(
                workspace_id='test-workspace',
                query='test query'
            )

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_unsupported_engine(self, mock_get_workspace):
        """Test semantic search with unsupported engine"""
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'unsupported'
        }
        mock_get_workspace.return_value = mock_workspace
        
        with pytest.raises(genai_core.types.CommonError, match="Semantic search is not supported"):
            genai_core.semantic_search.semantic_search(
                workspace_id='test-workspace',
                query='test query'
            )


class TestSemanticSearchCompare:
    """Test cases for semantic search compare functionality"""

    @patch('genai_core.semantic_search.semantic_search')
    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_compare_success(self, mock_get_workspace, mock_semantic_search):
        """Test successful multi-prompt comparison"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock search results
        mock_semantic_search.side_effect = [
            {'engine': 'opensearch', 'items': [{'content': 'result1', 'score': 0.9}]},
            {'engine': 'opensearch', 'items': [{'content': 'result2', 'score': 0.8}]}
        ]
        
        # Execute
        result = genai_core.semantic_search.semantic_search_compare_prompts(
            workspace_id='test-workspace',
            prompts=['prompt1', 'prompt2'],
            limit=5,
            full_response=True
        )
        
        # Assert
        assert result['workspace_id'] == 'test-workspace'
        assert result['total_prompts'] == 2
        assert result['engine'] == 'opensearch'
        assert 'prompt_1' in result['prompts_comparison']
        assert 'prompt_2' in result['prompts_comparison']
        assert result['prompts_comparison']['prompt_1']['prompt'] == 'prompt1'
        assert result['prompts_comparison']['prompt_2']['prompt'] == 'prompt2'
        
        # Verify semantic_search was called for each prompt
        assert mock_semantic_search.call_count == 2

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_compare_empty_prompts(self, mock_get_workspace):
        """Test comparison with empty prompts list"""
        with pytest.raises(genai_core.types.CommonError, match="At least one prompt is required"):
            genai_core.semantic_search.semantic_search_compare_prompts(
                workspace_id='test-workspace',
                prompts=[],
                limit=5
            )

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_compare_too_many_prompts(self, mock_get_workspace):
        """Test comparison with too many prompts"""
        prompts = [f'prompt{i}' for i in range(11)]  # 11 prompts
        
        with pytest.raises(genai_core.types.CommonError, match="Maximum 10 prompts allowed"):
            genai_core.semantic_search.semantic_search_compare_prompts(
                workspace_id='test-workspace',
                prompts=prompts,
                limit=5
            )

    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_compare_workspace_not_found(self, mock_get_workspace):
        """Test comparison with non-existent workspace"""
        mock_get_workspace.return_value = None
        
        with pytest.raises(genai_core.types.CommonError, match="Workspace not found"):
            genai_core.semantic_search.semantic_search_compare_prompts(
                workspace_id='non-existent',
                prompts=['prompt1', 'prompt2']
            )

    @patch('genai_core.semantic_search.semantic_search')
    @patch('genai_core.workspaces.get_workspace')
    def test_semantic_search_compare_with_errors(self, mock_get_workspace, mock_semantic_search):
        """Test comparison when some prompts fail"""
        # Mock workspace
        mock_workspace = {
            'workspace_id': 'test-workspace',
            'status': 'ready',
            'engine': 'opensearch'
        }
        mock_get_workspace.return_value = mock_workspace
        
        # Mock search results - first succeeds, second fails
        mock_semantic_search.side_effect = [
            {'engine': 'opensearch', 'items': [{'content': 'result1', 'score': 0.9}]},
            Exception("Search failed")
        ]
        
        # Execute
        result = genai_core.semantic_search.semantic_search_compare_prompts(
            workspace_id='test-workspace',
            prompts=['prompt1', 'prompt2'],
            limit=5,
            full_response=True
        )
        
        # Assert
        assert result['total_prompts'] == 2
        assert 'prompt_1' in result['prompts_comparison']
        assert 'prompt_2' in result['prompts_comparison']
        
        # First prompt should have result
        assert 'result' in result['prompts_comparison']['prompt_1']
        assert 'error' not in result['prompts_comparison']['prompt_1']
        
        # Second prompt should have error
        assert 'error' in result['prompts_comparison']['prompt_2']
        assert result['prompts_comparison']['prompt_2']['error'] == "Search failed"


if __name__ == '__main__':
    pytest.main([__file__])
