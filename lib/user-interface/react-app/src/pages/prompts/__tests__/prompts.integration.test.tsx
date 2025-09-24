import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Prompts from '../prompts';
import ChatInputPanel from '../../../components/chatbot/chat-input-panel';

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock chat input panel props
const mockChatProps = {
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

describe('Prompts to Chat Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: '1',
        name: 'Integration Test Prompt',
        content: 'This is an integration test prompt',
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ]));
  });

  test('complete flow from prompts to chat with prefilled content', async () => {
    const TestApp = () => (
      <MemoryRouter initialEntries={['/prompts']}>
        <Routes>
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/chatbot/playground" element={<ChatInputPanel {...mockChatProps} />} />
        </Routes>
      </MemoryRouter>
    );

    render(<TestApp />);

    // Verify we're on prompts page
    expect(screen.getByText('Prompt Management')).toBeInTheDocument();
    expect(screen.getByText('Integration Test Prompt')).toBeInTheDocument();

    // Click Use button
    const useButton = screen.getByText('Use');
    fireEvent.click(useButton);

    // Verify sessionStorage was called
    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'selectedPrompt',
        'This is an integration test prompt'
      );
    });

    // Simulate navigation to chat page
    mockSessionStorage.getItem.mockReturnValue('This is an integration test prompt');
    
    // Re-render with chat page
    const ChatApp = () => (
      <MemoryRouter initialEntries={['/chatbot/playground']}>
        <Routes>
          <Route path="/chatbot/playground" element={<ChatInputPanel {...mockChatProps} />} />
        </Routes>
      </MemoryRouter>
    );

    render(<ChatApp />);

    // Verify sessionStorage cleanup
    await waitFor(() => {
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedPrompt');
    });
  });
});
