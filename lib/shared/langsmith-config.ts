import { getConfig } from "../../bin/config";

export interface LangSmithConfig {
  enabled: boolean;
  apiKey?: string;
  project?: string;
  endpoint?: string;
}

export function loadLangSmithConfig(): LangSmithConfig {
  const config = getConfig();
  
  return {
    enabled: config.langsmith?.enabled || false,
    apiKey: config.langsmith?.apiKey,
    project: config.langsmith?.project || "genai-rag-workspace",
    endpoint: config.langsmith?.endpoint || "https://api.smith.langchain.com"
  };
}
