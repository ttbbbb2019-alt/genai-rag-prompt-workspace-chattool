const { MCPLambdaClient } = require('../../lib/mcp/lambda-client');
const { AuthClient } = require('../../lib/auth-client');

// Mock AuthClient
jest.mock('../../lib/auth-client');

describe('MCPLambdaClient', () => {
  let lambdaClient;
  let mockAuthClient;

  beforeEach(() => {
    mockAuthClient = {
      isAuthenticated: jest.fn(),
      interactiveLogin: jest.fn(),
      getValidToken: jest.fn(),
      logout: jest.fn()
    };

    AuthClient.mockImplementation(() => mockAuthClient);

    lambdaClient = new MCPLambdaClient(
      'https://test-lambda.amazonaws.com/mcp',
      'region_test123',
      'test-client-id',
      'test-region'
    );

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.fetch;
  });

  describe('authenticate', () => {
    test('should use existing token when authenticated', async () => {
      mockAuthClient.isAuthenticated.mockReturnValue(true);
      mockAuthClient.getValidToken.mockResolvedValue('valid-token');

      const token = await lambdaClient.authenticate();

      expect(token).toBe('valid-token');
      expect(mockAuthClient.interactiveLogin).not.toHaveBeenCalled();
    });

    test('should perform interactive login when not authenticated', async () => {
      mockAuthClient.isAuthenticated.mockReturnValue(false);
      mockAuthClient.interactiveLogin.mockResolvedValue();
      mockAuthClient.getValidToken.mockResolvedValue('new-token');

      const token = await lambdaClient.authenticate();

      expect(token).toBe('new-token');
      expect(mockAuthClient.interactiveLogin).toHaveBeenCalled();
    });
  });

  describe('sendRequest', () => {
    beforeEach(() => {
      mockAuthClient.isAuthenticated.mockReturnValue(true);
      mockAuthClient.getValidToken.mockResolvedValue('test-token');
    });

    test('should send successful request', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await lambdaClient.sendRequest('test/method', { param: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-lambda.amazonaws.com/mcp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'test/method',
            params: { param: 'value' }
          })
        }
      );

      expect(result).toEqual({ success: true });
    });

    test('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(lambdaClient.sendRequest('test/method'))
        .rejects.toThrow('HTTP 500: Internal Server Error');
    });

    test('should handle JSON-RPC errors', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(lambdaClient.sendRequest('test/method'))
        .rejects.toThrow('Internal error');
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(lambdaClient.sendRequest('test/method'))
        .rejects.toThrow('Network error');
    });
  });

  describe('listTools', () => {
    test('should call tools/list method', async () => {
      mockAuthClient.isAuthenticated.mockReturnValue(true);
      mockAuthClient.getValidToken.mockResolvedValue('test-token');

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: [
            { name: 'chat', description: 'Chat with AI' }
          ]
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await lambdaClient.listTools();

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('chat');
    });
  });

  describe('callTool', () => {
    test('should call tools/call method', async () => {
      mockAuthClient.isAuthenticated.mockReturnValue(true);
      mockAuthClient.getValidToken.mockResolvedValue('test-token');

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [
            { type: 'text', text: 'Tool result' }
          ]
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await lambdaClient.callTool('chat', { message: 'Hello' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-lambda.amazonaws.com/mcp',
        expect.objectContaining({
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'chat',
              arguments: { message: 'Hello' }
            }
          })
        })
      );

      expect(result.content).toHaveLength(1);
    });
  });

  describe('chat', () => {
    test('should call chat/completions method', async () => {
      mockAuthClient.isAuthenticated.mockReturnValue(true);
      mockAuthClient.getValidToken.mockResolvedValue('test-token');

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Hello! How can I help you?'
              }
            }
          ]
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { model: 'claude-3-sonnet', temperature: 0.7 };

      const result = await lambdaClient.chat(messages, options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-lambda.amazonaws.com/mcp',
        expect.objectContaining({
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'chat/completions',
            params: {
              messages,
              model: 'claude-3-sonnet',
              temperature: 0.7
            }
          })
        })
      );

      expect(result.choices).toHaveLength(1);
    });
  });

  describe('logout', () => {
    test('should call auth client logout', () => {
      lambdaClient.logout();
      expect(mockAuthClient.logout).toHaveBeenCalled();
    });
  });
});
