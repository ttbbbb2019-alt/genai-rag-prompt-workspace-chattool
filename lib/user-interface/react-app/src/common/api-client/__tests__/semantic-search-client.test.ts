import { API } from 'aws-amplify';
import { SemanticSearchClient } from '../semantic-search-client';
import { jest } from '@jest/globals';

// Mock AWS Amplify API
jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
}));

const mockedAPI = API as jest.Mocked<typeof API>;

describe('SemanticSearchClient', () => {
  let client: SemanticSearchClient;

  beforeEach(() => {
    client = new SemanticSearchClient();
    jest.clearAllMocks();
  });

  describe('query', () => {
    test('calls API.graphql with correct parameters for single search', async () => {
      const mockResult = {
        data: {
          performSemanticSearch: {
            engine: 'opensearch',
            workspaceId: 'test-workspace',
            items: [],
          },
        },
      };

      (mockedAPI.graphql as any).mockResolvedValue(mockResult);

      const result = await client.query('test-workspace', 'test query');

      expect(mockedAPI.graphql).toHaveBeenCalledWith({
        query: expect.any(String),
        variables: {
          input: {
            workspaceId: 'test-workspace',
            query: 'test query',
          },
        },
      });

      expect(result).toBe(mockResult);
    });

    test('handles API errors for single search', async () => {
      const mockError = new Error('API Error');
      (mockedAPI.graphql as any).mockRejectedValue(mockError);

      await expect(client.query('test-workspace', 'test query')).rejects.toThrow('API Error');
    });
  });

  describe('compare', () => {
    test('calls API.graphql with correct parameters for comparison', async () => {
      const mockResult = {
        data: {
          performSemanticSearchCompare: {
            workspaceId: 'test-workspace',
            totalPrompts: 2,
            engine: 'opensearch',
            promptsComparison: [],
          },
        },
      };

      (mockedAPI.graphql as any).mockResolvedValue(mockResult);

      const input = {
        workspaceId: 'test-workspace',
        prompts: ['prompt1', 'prompt2'],
        limit: 25,
      };

      const result = await client.compare(input);

      expect(mockedAPI.graphql).toHaveBeenCalledWith({
        query: expect.any(String),
        variables: {
          input,
        },
      });

      expect(result).toBe(mockResult);
    });

    test('handles API errors for comparison', async () => {
      const mockError = new Error('Comparison API Error');
      (mockedAPI.graphql as any).mockRejectedValue(mockError);

      const input = {
        workspaceId: 'test-workspace',
        prompts: ['prompt1', 'prompt2'],
      };

      await expect(client.compare(input)).rejects.toThrow('Comparison API Error');
    });

    test('works with minimal input parameters', async () => {
      const mockResult = {
        data: {
          performSemanticSearchCompare: {
            workspaceId: 'test-workspace',
            totalPrompts: 2,
            engine: 'opensearch',
            promptsComparison: [],
          },
        },
      };

      (mockedAPI.graphql as any).mockResolvedValue(mockResult);

      const input = {
        workspaceId: 'test-workspace',
        prompts: ['prompt1', 'prompt2'],
      };

      const result = await client.compare(input);

      expect(mockedAPI.graphql).toHaveBeenCalledWith({
        query: expect.any(String),
        variables: {
          input,
        },
      });

      expect(result).toBe(mockResult);
    });

    test('works with all input parameters', async () => {
      const mockResult = {
        data: {
          performSemanticSearchCompare: {
            workspaceId: 'test-workspace',
            totalPrompts: 3,
            engine: 'opensearch',
            promptsComparison: [],
          },
        },
      };

      (mockedAPI.graphql as any).mockResolvedValue(mockResult);

      const input = {
        workspaceId: 'test-workspace',
        prompts: ['prompt1', 'prompt2', 'prompt3'],
        limit: 50,
      };

      const result = await client.compare(input);

      expect(mockedAPI.graphql).toHaveBeenCalledWith({
        query: expect.any(String),
        variables: {
          input,
        },
      });

      expect(result).toBe(mockResult);
    });
  });
});
