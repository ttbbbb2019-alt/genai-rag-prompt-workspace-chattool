import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatInputPanel from '../chat-input-panel';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock props
const mockProps = {
  running: false,
  setRunning: jest.fn(),
  messageHistory: [],
  setMessageHistory: jest.fn(),
  configuration: {
    streaming: true,
    showMetadata: false,
    maxTokens: 512,
    temperature: 0.6,
    topP: 0.9,
  },
  setConfiguration: jest.fn(),
  session: { id: 'test-session', loading: false },
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ChatInputPanel - Prompt Prefill Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prefills prompt from sessionStorage on mount', async () => {
    const testPrompt = 'Test prompt from storage';
    mockSessionStorage.getItem.mockReturnValue(testPrompt);

    renderWithRouter(<ChatInputPanel {...mockProps} />);

    await waitFor(() => {
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('selectedPrompt');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedPrompt');
    });
  });

  test('does not prefill when no prompt in sessionStorage', async () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    renderWithRouter(<ChatInputPanel {...mockProps} />);

    await waitFor(() => {
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('selectedPrompt');
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
