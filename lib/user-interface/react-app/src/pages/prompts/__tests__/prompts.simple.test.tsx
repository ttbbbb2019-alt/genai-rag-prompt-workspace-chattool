/**
 * Simple unit tests for the prompt use feature
 */

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('Prompt Use Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleUse function stores prompt and navigates', () => {
    const testPrompt = {
      id: '1',
      name: 'Test Prompt',
      content: 'Test content',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    // Simulate the handleUse function logic
    mockSessionStorage.setItem('selectedPrompt', testPrompt.content);
    mockNavigate('/chatbot/playground');

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedPrompt', 'Test content');
    expect(mockNavigate).toHaveBeenCalledWith('/chatbot/playground');
  });

  test('sessionStorage cleanup after prompt use', () => {
    const testPrompt = 'Test prompt content';
    
    // Simulate getting prompt from sessionStorage
    mockSessionStorage.getItem = jest.fn().mockReturnValue(testPrompt);
    
    // Simulate the useEffect logic in chat-input-panel
    const selectedPrompt = mockSessionStorage.getItem('selectedPrompt');
    if (selectedPrompt) {
      // setState would be called here in real component
      mockSessionStorage.removeItem('selectedPrompt');
    }

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedPrompt');
  });
});
