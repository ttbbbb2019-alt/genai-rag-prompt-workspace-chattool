import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Prompts from '../prompts';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Prompts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: '1',
        name: 'Test Prompt',
        content: 'This is a test prompt content',
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ]));
  });

  test('renders prompts page with Use button', () => {
    renderWithRouter(<Prompts />);
    
    expect(screen.getByText('Prompt Management')).toBeInTheDocument();
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Use')).toBeInTheDocument();
  });

  test('Use button navigates to chat and stores prompt', async () => {
    renderWithRouter(<Prompts />);
    
    const useButton = screen.getByText('Use');
    fireEvent.click(useButton);

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'selectedPrompt',
        'This is a test prompt content'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/chatbot/playground');
    });
  });

  test('Use button is primary variant', () => {
    renderWithRouter(<Prompts />);
    
    const useButton = screen.getByText('Use');
    expect(useButton.closest('button')).toHaveClass('awsui-button-variant-primary');
  });
});
