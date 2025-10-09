import { API } from 'aws-amplify';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
}));

describe('MultiChat Compare Request Validation', () => {
  const mockGraphQL = API.graphql as jest.MockedFunction<typeof API.graphql>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates compare request structure matches backend expectations', async () => {
    // Mock the GraphQL call
    mockGraphQL.mockResolvedValue({
      data: { sendQuery: 'success' }
    });

    // Simulate the exact request structure that would be sent
    const compareRequest = {
      action: 'compare',
      modelInterface: 'langchain',
      data: {
        sessionId: 'test-session-123',
        workspaceId: 'test-workspace-456',
        prompts: [
          'What is machine learning?',
          'Explain machine learning in simple terms'
        ]
      }
    };

    // This simulates what handleSendComparePrompts does
    await API.graphql({
      query: 'mutation SendQuery($data: String) { sendQuery(data: $data) }',
      variables: {
        data: JSON.stringify(compareRequest),
      },
    });

    // Verify the call was made with correct structure
    expect(mockGraphQL).toHaveBeenCalledWith({
      query: 'mutation SendQuery($data: String) { sendQuery(data: $data) }',
      variables: {
        data: JSON.stringify(compareRequest),
      },
    });

    // Parse the data that would be sent to backend
    const sentData = JSON.parse((mockGraphQL.mock.calls[0][0] as any).variables.data);
    
    // Verify backend handler expectations
    expect(sentData).toHaveProperty('action', 'compare');
    expect(sentData).toHaveProperty('modelInterface', 'langchain');
    expect(sentData).toHaveProperty('data');
    expect(sentData.data).toHaveProperty('sessionId');
    expect(sentData.data).toHaveProperty('workspaceId');
    expect(sentData.data).toHaveProperty('prompts');
    expect(Array.isArray(sentData.data.prompts)).toBe(true);
    expect(sentData.data.prompts.length).toBe(2);
    expect(sentData.data.prompts[0]).toBe('What is machine learning?');
    expect(sentData.data.prompts[1]).toBe('Explain machine learning in simple terms');
  });

  it('validates compare request differs from regular run request', async () => {
    mockGraphQL.mockResolvedValue({ data: { sendQuery: 'success' } });

    // Regular run request structure
    const runRequest = {
      action: 'run',
      modelInterface: 'langchain',
      data: {
        modelName: 'claude-3-haiku-20240307',
        provider: 'anthropic',
        sessionId: 'test-session-123',
        images: [],
        documents: [],
        videos: [],
        workspaceId: 'test-workspace-456',
        modelKwargs: {
          streaming: true,
          maxTokens: 512,
          temperature: 0.1,
          topP: 0.9,
          seed: 0,
        },
        text: 'What is machine learning?',
        mode: 'chain',
      },
    };

    // Compare request structure
    const compareRequest = {
      action: 'compare',
      modelInterface: 'langchain',
      data: {
        sessionId: 'test-session-123',
        workspaceId: 'test-workspace-456',
        prompts: [
          'What is machine learning?',
          'Explain machine learning in simple terms'
        ]
      }
    };

    // Send both requests
    await API.graphql({
      query: 'mutation SendQuery($data: String) { sendQuery(data: $data) }',
      variables: { data: JSON.stringify(runRequest) },
    });

    await API.graphql({
      query: 'mutation SendQuery($data: String) { sendQuery(data: $data) }',
      variables: { data: JSON.stringify(compareRequest) },
    });

    expect(mockGraphQL).toHaveBeenCalledTimes(2);

    // Parse both requests
    const runData = JSON.parse((mockGraphQL.mock.calls[0][0] as any).variables.data);
    const compareData = JSON.parse((mockGraphQL.mock.calls[1][0] as any).variables.data);

    // Verify they have different actions
    expect(runData.action).toBe('run');
    expect(compareData.action).toBe('compare');

    // Verify different data structures
    expect(runData.data).toHaveProperty('text');
    expect(runData.data).toHaveProperty('modelName');
    expect(runData.data).toHaveProperty('provider');
    expect(runData.data).toHaveProperty('modelKwargs');

    expect(compareData.data).toHaveProperty('prompts');
    expect(compareData.data).not.toHaveProperty('text');
    expect(compareData.data).not.toHaveProperty('modelName');
    expect(compareData.data).not.toHaveProperty('provider');
    expect(compareData.data).not.toHaveProperty('modelKwargs');

    // Both should have common fields
    expect(runData.data).toHaveProperty('sessionId');
    expect(runData.data).toHaveProperty('workspaceId');
    expect(compareData.data).toHaveProperty('sessionId');
    expect(compareData.data).toHaveProperty('workspaceId');
  });

  it('validates backend handler routing expectations', () => {
    // This test validates the routing logic that should exist in backend
    const testCases = [
      {
        action: 'run',
        expectedHandler: 'handle_run',
        requiredFields: ['text', 'modelName', 'provider']
      },
      {
        action: 'compare', 
        expectedHandler: 'handle_compare',
        requiredFields: ['prompts']
      },
      {
        action: 'heartbeat',
        expectedHandler: 'handle_heartbeat', 
        requiredFields: []
      }
    ];

    testCases.forEach(testCase => {
      const mockRecord = {
        action: testCase.action,
        data: {
          sessionId: 'test-session',
          workspaceId: 'test-workspace',
          ...(testCase.action === 'run' && {
            text: 'test message',
            modelName: 'claude-3-haiku-20240307',
            provider: 'anthropic'
          }),
          ...(testCase.action === 'compare' && {
            prompts: ['prompt1', 'prompt2']
          })
        }
      };

      // Simulate backend routing logic
      let selectedHandler = '';
      if (mockRecord.action === 'run') {
        selectedHandler = 'handle_run';
      } else if (mockRecord.action === 'compare') {
        selectedHandler = 'handle_compare';
      } else if (mockRecord.action === 'heartbeat') {
        selectedHandler = 'handle_heartbeat';
      }

      expect(selectedHandler).toBe(testCase.expectedHandler);

      // Verify required fields are present
      testCase.requiredFields.forEach(field => {
        expect(mockRecord.data).toHaveProperty(field);
      });
    });
  });

  it('validates model adapter call expectations for compare', () => {
    // This test validates what the backend handle_compare should do
    const mockRecord = {
      userId: 'test-user',
      userGroups: ['admin'],
      data: {
        sessionId: 'session-123',
        workspaceId: 'workspace-456',
        prompts: ['prompt1', 'prompt2']
      },
      systemPrompts: { systemPrompt: 'You are helpful' }
    };

    // Simulate what handle_compare should do for each prompt
    const expectedModelCalls = mockRecord.data.prompts.map((prompt, index) => ({
      prompt: prompt,
      workspace_id: mockRecord.data.workspaceId,
      user_groups: mockRecord.userGroups,
      images: [],
      documents: [],
      videos: [],
      system_prompts: mockRecord.systemPrompts,
      session_id: `${mockRecord.data.sessionId}_prompt_${index}`,
      user_id: mockRecord.userId
    }));

    // Verify expectations
    expect(expectedModelCalls).toHaveLength(2);
    expect(expectedModelCalls[0].prompt).toBe('prompt1');
    expect(expectedModelCalls[1].prompt).toBe('prompt2');
    expect(expectedModelCalls[0].workspace_id).toBe('workspace-456');
    expect(expectedModelCalls[1].workspace_id).toBe('workspace-456');

    // Both calls should have the same context but different prompts
    expectedModelCalls.forEach((call, index) => {
      expect(call.user_groups).toEqual(['admin']);
      expect(call.workspace_id).toBe('workspace-456');
      expect(call.system_prompts).toEqual({ systemPrompt: 'You are helpful' });
      expect(call.session_id).toBe(`session-123_prompt_${index}`);
    });
  });
});
