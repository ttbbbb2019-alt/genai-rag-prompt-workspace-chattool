import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatInputPanel from '../chat-input-panel';
import { AppContext } from '../../../common/app-context';

// Mock dependencies
jest.mock('react-speech-recognition', () => ({
  useSpeechRecognition: () => ({
    transcript: '',
    listening: false,
    browserSupportsSpeechRecognition: true,
  }),
  __esModule: true,
  default: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
}));

const mockAppContext = {
  config: {
    rag_enabled: true,
    aws_project_region: 'us-east-1',
    aws_user_pools_id: 'test-pool-id',
    aws_user_pools_web_client_id: 'test-client-id',
  },
} as any;

const defaultProps = {
  running: false,
  setRunning: jest.fn(),
  session: { id: 'test-session', loading: false },
  messageHistory: [],
  setMessageHistory: jest.fn(),
  configuration: {
    streaming: true,
    showMetadata: false,
    maxTokens: 512,
    temperature: 0.6,
    topP: 0.9,
    images: null,
    documents: null,
    videos: null,
    seed: 0,
    filesBlob: {
      images: null,
      documents: null,
      videos: null,
    },
  },
  setConfiguration: jest.fn(),
  setApplication: jest.fn(),
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <AppContext.Provider value={mockAppContext}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AppContext.Provider>
  );
};

describe('ChatInputPanel Prompt Selection', () => {
  beforeEach(() => {
    // Mock localStorage
    const mockPrompts = [
      { id: '1', name: 'Test Prompt', content: 'This is a test prompt' },
      { id: '2', name: 'Another Prompt', content: 'Another test prompt content' },
    ];
    localStorage.setItem('chatbot-prompts', JSON.stringify(mockPrompts));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('loads prompts from localStorage', async () => {
    renderWithContext(<ChatInputPanel {...defaultProps} />);
    
    await waitFor(() => {
      const promptSelect = screen.getByDisplayValue('Select a prompt template (optional)');
      expect(promptSelect).toBeInTheDocument();
    });
  });

  test('handles prompt selection', async () => {
    renderWithContext(<ChatInputPanel {...defaultProps} />);
    
    await waitFor(() => {
      const promptSelect = screen.getByDisplayValue('Select a prompt template (optional)');
      fireEvent.change(promptSelect, { target: { value: '1' } });
    });
  });

  test('handles sessionStorage prompt from prompts page', () => {
    sessionStorage.setItem('selectedPrompt', 'Test prompt content');
    
    renderWithContext(<ChatInputPanel {...defaultProps} />);
    
    expect(sessionStorage.getItem('selectedPrompt')).toBeNull();
  });
});
