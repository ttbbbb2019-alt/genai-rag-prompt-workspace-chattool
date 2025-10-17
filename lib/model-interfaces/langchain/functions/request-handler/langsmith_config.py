import os

def init_langsmith():
    """Initialize LangSmith tracing for LangChain"""
    enabled = os.getenv("LANGSMITH_ENABLED", "false").lower() == "true"
    if not enabled:
        return False

    # Set LangChain tracing environment variables
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "genai-rag-workspace")
    
    api_key = os.getenv("LANGSMITH_API_KEY")
    if api_key:
        os.environ["LANGCHAIN_API_KEY"] = api_key
        
    os.environ["LANGCHAIN_ENDPOINT"] = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    
    print(f"[LangSmith] ✅ Initialized tracing for project: {os.getenv('LANGCHAIN_PROJECT')}")
    return True

# Initialize on import
langsmith_enabled = init_langsmith()
