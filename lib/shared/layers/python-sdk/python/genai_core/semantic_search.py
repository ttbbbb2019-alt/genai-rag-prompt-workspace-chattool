import genai_core.types
import genai_core.workspaces
import genai_core.embeddings
from genai_core.aurora import query_workspace_aurora
from genai_core.opensearch import query_workspace_open_search
from genai_core.kendra import query_workspace_kendra
from genai_core.bedrock_kb import query_workspace_bedrock_kb
from typing import List, Dict, Any


def semantic_search(
    workspace_id: str, query: str, limit: int = 5, full_response: bool = False
):
    workspace = genai_core.workspaces.get_workspace(workspace_id)

    if not workspace:
        raise genai_core.types.CommonError("Workspace not found")

    if workspace["status"] != "ready":
        raise genai_core.types.CommonError("Workspace is not ready")

    if workspace["engine"] == "aurora":
        return query_workspace_aurora(
            workspace_id, workspace, query, limit, full_response
        )
    elif workspace["engine"] == "opensearch":
        return query_workspace_open_search(
            workspace_id, workspace, query, limit, full_response
        )
    elif workspace["engine"] == "kendra":
        return query_workspace_kendra(
            workspace_id, workspace, query, limit, full_response
        )
    elif workspace["engine"] == "bedrock_kb":
        return query_workspace_bedrock_kb(
            workspace_id, workspace, query, limit, full_response
        )

    raise genai_core.types.CommonError(
        "Semantic search is not supported for this workspace"
    )


def semantic_search_compare_prompts(
    workspace_id: str, prompts: List[str], limit: int = 5, full_response: bool = False
) -> Dict[str, Any]:
    """
    Compare multiple prompts using semantic search
    
    Args:
        workspace_id: The workspace ID
        prompts: List of prompts to compare
        limit: Number of results per prompt
        full_response: Whether to return full response details
        
    Returns:
        Dictionary with comparison results for each prompt
    """
    if not prompts or len(prompts) == 0:
        raise genai_core.types.CommonError("At least one prompt is required")
    
    if len(prompts) > 10:  # Limit to prevent abuse
        raise genai_core.types.CommonError("Maximum 10 prompts allowed for comparison")
    
    workspace = genai_core.workspaces.get_workspace(workspace_id)
    if not workspace:
        raise genai_core.types.CommonError("Workspace not found")
    
    if workspace["status"] != "ready":
        raise genai_core.types.CommonError("Workspace is not ready")
    
    results = {}
    
    for i, prompt in enumerate(prompts):
        prompt_key = f"prompt_{i + 1}"
        try:
            result = semantic_search(workspace_id, prompt, limit, full_response)
            results[prompt_key] = {
                "prompt": prompt,
                "result": result
            }
        except Exception as e:
            results[prompt_key] = {
                "prompt": prompt,
                "error": str(e)
            }
    
    # Add comparison metadata
    comparison_result = {
        "workspace_id": workspace_id,
        "total_prompts": len(prompts),
        "engine": workspace["engine"],
        "prompts_comparison": results
    }
    
    return comparison_result
