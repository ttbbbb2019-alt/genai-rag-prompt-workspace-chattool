
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import SemanticSearchCompare from '../semantic-search-compare';
import { AppContext } from '../../../../common/app-context';
import { ApiClient } from '../../../../common/api-client/api-client';

// Mock the ApiClient
jest.mock('../../../../common/api-client/api-client');

// @ts-ignore - Suppress TypeScript errors for test mocks

// Mock the child components
jest.mock('../result-items', () => {
  return function MockResultItems({ searchQuery }: { searchQuery: string }) {
    return <div data-testid="result-items">Results for: {searchQuery}</div>;
  };
});

jest.mock('../semantic-search-details', () => {
  return function MockSemanticSearchDetails() {
    return <div data-testid="semantic-search-details">Search Details</div>;
  };
});

const mockAppContext = {
  amplifyConfig: {
    aws_project_region: 'us-east-1',
    aws_user_pools_id: 'test-pool-id',
    aws_user_pools_web_client_id: 'test-client-id',
    config: {}
  },
  user: { username: 'testuser' },
};

const MockedApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

describe('SemanticSearchCompare', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (workspaceId = 'test-workspace') => {
    return render(
      <AppContext.Provider value={mockAppContext as any}>
        <SemanticSearchCompare workspaceId={workspaceId} />
      </AppContext.Provider>
    );
  };

  test('renders initial state with two prompt inputs', () => {
    renderComponent();
    
    expect(screen.getByText('Compare Multiple Prompts')).toBeInTheDocument();
    expect(screen.getAllByText(/Prompt \d+/)).toHaveLength(2);
    expect(screen.getByText('Add Prompt')).toBeInTheDocument();
    expect(screen.getByText('Compare Prompts')).toBeInTheDocument();
  });

  test('adds new prompt input when Add Prompt is clicked', () => {
    renderComponent();
    
    const addButton = screen.getByText('Add Prompt');
    fireEvent.click(addButton);
    
    expect(screen.getAllByText(/Prompt \d+/)).toHaveLength(3);
  });

  test('removes prompt input when remove button is clicked', () => {
    renderComponent();
    
    // Add a third prompt first
    const addButton = screen.getByText('Add Prompt');
    fireEvent.click(addButton);
    
    // Now remove one
    const removeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(removeButtons[0]);
    
    expect(screen.getAllByText(/Prompt \d+/)).toHaveLength(2);
  });

  test('disables Add Prompt button when maximum prompts reached', () => {
    renderComponent();
    
    const addButton = screen.getByText('Add Prompt');
    
    // Add prompts until we reach the limit (10 total)
    for (let i = 0; i < 8; i++) {
      fireEvent.click(addButton);
    }
    
    expect(addButton).toBeDisabled();
  });

  test('updates prompt text when typing in textarea', () => {
    renderComponent();
    
    const textareas = screen.getAllByRole('textbox');
    const firstTextarea = textareas[0];
    
    fireEvent.change(firstTextarea, { target: { value: 'Test prompt 1' } });
    
    expect(firstTextarea).toHaveValue('Test prompt 1');
  });

  test('disables Compare Prompts button when less than 2 valid prompts', () => {
    renderComponent();
    
    const compareButton = screen.getByText('Compare Prompts');
    expect(compareButton).toBeDisabled();
    
    // Add one prompt
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Test prompt 1' } });
    
    expect(compareButton).toBeDisabled();
    
    // Add second prompt
    fireEvent.change(textareas[1], { target: { value: 'Test prompt 2' } });
    
    expect(compareButton).not.toBeDisabled();
  });

  test('shows warning when no workspace is selected', () => {
    renderComponent('');
    
    expect(screen.getByText('Please select a workspace in the Single Search tab first.')).toBeInTheDocument();
  });

  test('performs comparison when Compare Prompts is clicked', async () => {
    const mockCompareResult = {
      data: {
        performSemanticSearchCompare: {
          workspaceId: 'test-workspace',
          totalPrompts: 2,
          engine: 'opensearch',
          promptsComparison: [
            {
              prompt: 'Test prompt 1',
              error: null,
              result: {
                engine: 'opensearch',
                items: [{ content: 'Result 1', score: 0.9 }],
              },
            },
            {
              prompt: 'Test prompt 2',
              error: null,
              result: {
                engine: 'opensearch',
                items: [{ content: 'Result 2', score: 0.8 }],
              },
            },
          ],
        },
      },
    };

    const mockApiInstance = {
      semanticSearch: {
        compare: (jest.fn() as any).mockResolvedValue(mockCompareResult),
      },
    };

    MockedApiClient.mockImplementation(() => mockApiInstance as any);

    renderComponent();
    
    // Fill in prompts
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Test prompt 1' } });
    fireEvent.change(textareas[1], { target: { value: 'Test prompt 2' } });
    
    // Click compare
    const compareButton = screen.getByText('Compare Prompts');
    fireEvent.click(compareButton);
    
    // Wait for API call and results
    await waitFor(() => {
      expect(mockApiInstance.semanticSearch.compare).toHaveBeenCalledWith({
        workspaceId: 'test-workspace',
        prompts: ['Test prompt 1', 'Test prompt 2'],
        limit: 25,
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Comparison Results')).toBeInTheDocument();
      expect(screen.getByText('Comparing 2 prompts using opensearch engine')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const mockApiInstance = {
      semanticSearch: {
        compare: (jest.fn() as any).mockRejectedValue({
          errors: [{ message: 'API Error' }],
        }),
      },
    };

    MockedApiClient.mockImplementation(() => mockApiInstance as any);

    renderComponent();
    
    // Fill in prompts
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Test prompt 1' } });
    fireEvent.change(textareas[1], { target: { value: 'Test prompt 2' } });
    
    // Click compare
    const compareButton = screen.getByText('Compare Prompts');
    fireEvent.click(compareButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('displays error results for failed prompts', async () => {
    const mockCompareResult = {
      data: {
        performSemanticSearchCompare: {
          workspaceId: 'test-workspace',
          totalPrompts: 2,
          engine: 'opensearch',
          promptsComparison: [
            {
              prompt: 'Test prompt 1',
              error: null,
              result: {
                engine: 'opensearch',
                items: [{ content: 'Result 1', score: 0.9 }],
              },
            },
            {
              prompt: 'Test prompt 2',
              error: 'Search failed for this prompt',
              result: null,
            },
          ],
        },
      },
    };

    const mockApiInstance = {
      semanticSearch: {
        compare: (jest.fn() as any).mockResolvedValue(mockCompareResult),
      },
    };

    MockedApiClient.mockImplementation(() => mockApiInstance as any);

    renderComponent();
    
    // Fill in prompts
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Test prompt 1' } });
    fireEvent.change(textareas[1], { target: { value: 'Test prompt 2' } });
    
    // Click compare
    const compareButton = screen.getByText('Compare Prompts');
    fireEvent.click(compareButton);
    
    await waitFor(() => {
      expect(screen.getByText('Prompt 2 Error')).toBeInTheDocument();
      expect(screen.getByText('Search failed for this prompt')).toBeInTheDocument();
    });
  });

  test('dismisses error alert when dismiss button is clicked', async () => {
    const mockApiInstance = {
      semanticSearch: {
        compare: (jest.fn() as any).mockRejectedValue({
          errors: [{ message: 'API Error' }],
        }),
      },
    };

    MockedApiClient.mockImplementation(() => mockApiInstance as any);

    renderComponent(); // Use valid workspace
    
    // Fill in prompts to enable the Compare button
    const textareas = screen.getAllByTestId('textarea');
    fireEvent.change(textareas[0], { target: { value: 'Test prompt 1' } });
    fireEvent.change(textareas[1], { target: { value: 'Test prompt 2' } });
    
    // Click compare to trigger the error
    const compareButton = screen.getByText('Compare Prompts');
    fireEvent.click(compareButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
    
    // Dismiss the error
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);
    
    expect(screen.queryByText('API Error')).not.toBeInTheDocument();
  });
});
