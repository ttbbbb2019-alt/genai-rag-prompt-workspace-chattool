import { API } from "aws-amplify";
import { GraphQLQuery, GraphQLResult } from "@aws-amplify/api";
import { performSemanticSearch, performSemanticSearchCompare } from "../../graphql/queries";
import { 
  PerformSemanticSearchQuery, 
  PerformSemanticSearchCompareQuery,
  SemanticSearchCompareInput 
} from "../../API";

export class SemanticSearchClient {
  async query(
    workspaceId: string,
    query: string
  ): Promise<GraphQLResult<GraphQLQuery<PerformSemanticSearchQuery>>> {
    return API.graphql({
      query: performSemanticSearch,
      variables: { input: { workspaceId, query } },
    });
  }

  async compare(
    input: SemanticSearchCompareInput
  ): Promise<GraphQLResult<GraphQLQuery<PerformSemanticSearchCompareQuery>>> {
    return API.graphql({
      query: performSemanticSearchCompare,
      variables: { input },
    });
  }
}
