import { render, screen, fireEvent } from '@testing-library/react';
import MultiChatInputPanel from '../multi-chat-input-panel';

// Mock speech recognition
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

// Mock Cloudscape components
jest.mock('@cloudscape-design/components', () => ({
  SpaceBetween: ({ children }: any) => <div data-testid="space-between">{children}</div>,
  PromptInput: ({ value, placeholder, onChange, onAction, actionButtonIconName, disableActionButton }: any) => (
    <div data-testid="prompt-input">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.({ detail: { value: e.target.value } })}
        data-testid="input-field"
      />
      <button
        onClick={onAction}
        disabled={disableActionButton}
        data-testid={actionButtonIconName === 'send' ? 'send-button' : 'action-button'}
      >
        {actionButtonIconName}
      </button>
    </div>
  ),
  Toggle: ({ checked, onChange, children }: any) => (
    <label data-testid="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.({ detail: { checked: e.target.checked } })}
        data-testid="toggle-input"
      />
      {children}
    </label>
  ),
  ButtonGroup: ({ items, onItemClick }: any) => (
    <div data-testid="button-group">
      {items?.map((item: any, index: number) => (
        <button
          key={index}
          onClick={() => onItemClick?.({ detail: item })}
          data-testid={`button-${item.id}`}
        >
          {item.text}
        </button>
      ))}
    </div>
  ),
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
}));

describe('MultiChatInputPanel Compare Functionality', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnSendComparePrompts = jest.fn();

  const defaultProps = {
    running: false,
    enabled: true,
    compareMode: false,
    onSendMessage: mockOnSendMessage,
    onSendComparePrompts: mockOnSendComparePrompts,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without compare toggle (controlled by parent)', () => {
    render(<MultiChatInputPanel {...defaultProps} />);
    
    // Toggle should not be present in the component anymore
    expect(screen.queryByTestId('toggle')).not.toBeInTheDocument();
  });

  it('shows single input by default', () => {
    render(<MultiChatInputPanel {...defaultProps} />);
    
    const inputs = screen.getAllByTestId('prompt-input');
    expect(inputs).toHaveLength(1);
  });

  it('shows compare inputs when compareMode is true', () => {
    render(<MultiChatInputPanel {...defaultProps} compareMode={true} />);
    
    const inputs = screen.getAllByTestId('prompt-input');
    expect(inputs).toHaveLength(2); // Should show 2 prompt inputs
  });

  it('calls onSendMessage in normal mode', () => {
    render(<MultiChatInputPanel {...defaultProps} />);
    
    const input = screen.getByTestId('input-field');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('test message');
  });

  it('calls onSendComparePrompts in compare mode', () => {
    render(<MultiChatInputPanel {...defaultProps} compareMode={true} />);
    
    // Fill in prompts
    const inputs = screen.getAllByTestId('input-field');
    fireEvent.change(inputs[0], { target: { value: 'prompt 1' } });
    fireEvent.change(inputs[1], { target: { value: 'prompt 2' } });
    
    // Click send on the last input
    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);
    
    expect(mockOnSendComparePrompts).toHaveBeenCalledWith(['prompt 1', 'prompt 2']);
  });

  it('disables send button when less than 2 prompts in compare mode', () => {
    render(<MultiChatInputPanel {...defaultProps} compareMode={true} />);
    
    // Only fill first prompt
    const inputs = screen.getAllByTestId('input-field');
    fireEvent.change(inputs[0], { target: { value: 'prompt 1' } });
    
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when 2 or more prompts are filled', () => {
    render(<MultiChatInputPanel {...defaultProps} compareMode={true} />);
    
    // Fill both prompts
    const inputs = screen.getAllByTestId('input-field');
    fireEvent.change(inputs[0], { target: { value: 'prompt 1' } });
    fireEvent.change(inputs[1], { target: { value: 'prompt 2' } });
    
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });
});
