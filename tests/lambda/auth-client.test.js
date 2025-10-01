const { AuthClient } = require('../../lib/auth-client');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk');

// Mock enquirer
jest.mock('enquirer', () => ({
  prompt: jest.fn()
}));

describe('AuthClient', () => {
  let authClient;
  let mockCognito;

  beforeEach(() => {
    mockCognito = {
      initiateAuth: jest.fn(),
      signUp: jest.fn(),
      confirmSignUp: jest.fn()
    };

    AWS.CognitoIdentityServiceProvider.mockImplementation(() => mockCognito);

    authClient = new AuthClient('region_test123', 'test-client-id', 'test-region');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should successfully login with valid credentials', async () => {
      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600
        }
      };

      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(mockAuthResult)
      });

      const result = await authClient.login('testuser', 'password123');

      expect(mockCognito.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          USERNAME: 'testuser',
          PASSWORD: 'password123'
        }
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        idToken: 'id-token',
        refreshToken: 'refresh-token',
        expiresAt: expect.any(Number)
      });
    });

    test('should throw error on authentication failure', async () => {
      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.reject(new Error('Invalid credentials'))
      });

      await expect(authClient.login('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    test('should throw error when no AuthenticationResult', async () => {
      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve({})
      });

      await expect(authClient.login('testuser', 'password123'))
        .rejects.toThrow('Authentication failed');
    });
  });

  describe('interactiveLogin', () => {
    test('should prompt for credentials and login', async () => {
      const { prompt } = require('enquirer');
      prompt.mockResolvedValue({
        username: 'testuser',
        password: 'password123'
      });

      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600
        }
      };

      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(mockAuthResult)
      });

      const result = await authClient.interactiveLogin();

      expect(prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'username',
          message: 'Username or Email:'
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:'
        }
      ]);

      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('refreshToken', () => {
    test('should refresh token successfully', async () => {
      // Set up existing token cache
      authClient.tokenCache = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000
      };

      const mockRefreshResult = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600
        }
      };

      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(mockRefreshResult)
      });

      const result = await authClient.refreshToken();

      expect(mockCognito.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          REFRESH_TOKEN: 'refresh-token'
        }
      });

      expect(result.accessToken).toBe('new-access-token');
    });

    test('should throw error when no refresh token available', async () => {
      await expect(authClient.refreshToken())
        .rejects.toThrow('No refresh token available');
    });
  });

  describe('getValidToken', () => {
    test('should return valid token when not expired', async () => {
      authClient.tokenCache = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 600000 // 10 minutes from now
      };

      const token = await authClient.getValidToken();
      expect(token).toBe('valid-token');
    });

    test('should refresh token when expired', async () => {
      authClient.tokenCache = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000 // Expired
      };

      const mockRefreshResult = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600
        }
      };

      mockCognito.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(mockRefreshResult)
      });

      const token = await authClient.getValidToken();
      expect(token).toBe('new-access-token');
    });
  });

  describe('signUp', () => {
    test('should sign up user successfully', async () => {
      const mockSignUpResult = {
        UserSub: 'test-user-sub'
      };

      mockCognito.signUp.mockReturnValue({
        promise: () => Promise.resolve(mockSignUpResult)
      });

      const result = await authClient.signUp('testuser', 'password123', 'test@example.com');

      expect(mockCognito.signUp).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        Password: 'password123',
        UserAttributes: [
          {
            Name: 'email',
            Value: 'test@example.com'
          }
        ]
      });

      expect(result).toEqual(mockSignUpResult);
    });
  });

  describe('confirmSignUp', () => {
    test('should confirm sign up successfully', async () => {
      mockCognito.confirmSignUp.mockReturnValue({
        promise: () => Promise.resolve({})
      });

      await authClient.confirmSignUp('testuser', '123456');

      expect(mockCognito.confirmSignUp).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456'
      });
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when token is valid', () => {
      authClient.tokenCache = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 600000
      };

      expect(authClient.isAuthenticated()).toBe(true);
    });

    test('should return false when token is expired', () => {
      authClient.tokenCache = {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000
      };

      expect(authClient.isAuthenticated()).toBe(false);
    });

    test('should return false when no token cache', () => {
      expect(authClient.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    test('should clear token cache', () => {
      authClient.tokenCache = {
        accessToken: 'token',
        expiresAt: Date.now() + 600000
      };

      authClient.logout();

      expect(authClient.tokenCache).toBeNull();
    });
  });
});
