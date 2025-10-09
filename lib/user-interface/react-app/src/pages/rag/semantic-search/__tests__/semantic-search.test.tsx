import React from "react";

// Mock all the dependencies
jest.mock("../../../../common/hooks/use-on-follow", () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock("../../../../components/base-app-layout", () => ({
  __esModule: true,
  default: ({ content }: { content: React.ReactNode }) => <div data-testid="base-app-layout">{content}</div>,
}));

jest.mock("../../../../common/api-client/api-client");
jest.mock("../semantic-search-compare", () => ({
  __esModule: true,
  default: ({ workspaceId }: { workspaceId: string }) => (
    <div data-testid="semantic-search-compare">Compare component with workspace: {workspaceId}</div>
  ),
}));

jest.mock("../semantic-search-details", () => ({
  __esModule: true,
  default: () => <div data-testid="semantic-search-details">Details</div>,
}));

jest.mock("../result-items", () => ({
  __esModule: true,
  default: () => <div data-testid="result-items">Results</div>,
}));

// Mock Cloudscape components
jest.mock("@cloudscape-design/components", () => ({
  BreadcrumbGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="breadcrumb-group">{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="button">{children}</button>
  ),
  Container: ({ children }: { children: React.ReactNode }) => <div data-testid="container">{children}</div>,
  ContentLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="content-layout">{children}</div>,
  Form: ({ children }: { children: React.ReactNode }) => <div data-testid="form">{children}</div>,
  FormField: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div data-testid="form-field">
      <label>{label}</label>
      {children}
    </div>
  ),
  Header: ({ children }: { children: React.ReactNode }) => <h1 data-testid="header">{children}</h1>,
  HelpPanel: ({ children }: { children: React.ReactNode }) => <div data-testid="help-panel">{children}</div>,
  Select: ({ placeholder }: { placeholder: string }) => <select data-testid="select" aria-label={placeholder} />,
  SpaceBetween: ({ children }: { children: React.ReactNode }) => <div data-testid="space-between">{children}</div>,
  StatusIndicator: ({ children }: { children: React.ReactNode }) => <div data-testid="status-indicator">{children}</div>,
  Tabs: ({ tabs, activeTabId, onChange }: { 
    tabs: Array<{ id: string; label: string; content: React.ReactNode }>; 
    activeTabId?: string;
    onChange?: (event: { detail: { activeTabId: string } }) => void;
  }) => (
    <div data-testid="tabs">
      {tabs.map((tab) => (
        <div key={tab.id}>
          <button 
            data-testid={`tab-${tab.id}`}
            onClick={() => onChange?.({ detail: { activeTabId: tab.id } })}
            className={activeTabId === tab.id ? 'active' : ''}
          >
            {tab.label}
          </button>
          {activeTabId === tab.id && <div data-testid={`tab-content-${tab.id}`}>{tab.content}</div>}
        </div>
      ))}
    </div>
  ),
  Textarea: ({ value, onChange }: { value: string; onChange: (detail: { value: string }) => void }) => (
    <textarea 
      data-testid="textarea" 
      value={value} 
      onChange={(e) => onChange({ value: e.target.value })}
      aria-label="Search Query"
    />
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SemanticSearch from "../semantic-search";
import { AppContext } from "../../../../common/app-context";

const mockAppContext = {
  aws_project_region: "us-east-1",
  aws_user_pools_id: "test-pool", 
  aws_user_pools_web_client_id: "test-client",
  config: {
    rag_enabled: true,
    cross_encoders_enabled: false,
    sagemaker_embeddings_enabled: false,
    api_endpoint: "https://test.execute-api.us-east-1.amazonaws.com/prod/",
    websocket_endpoint: "wss://test.execute-api.us-east-1.amazonaws.com/prod/",
    default_embeddings_model: "amazon.titan-embed-text-v1",
    default_cross_encoder_model: "cross-encoder/ms-marco-MiniLM-L-12-v2",
    privateWebsite: false,
  },
};

describe("SemanticSearch Tab Navigation", () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AppContext.Provider value={mockAppContext}>
          <SemanticSearch />
        </AppContext.Provider>
      </BrowserRouter>
    );
  };

  it("renders with tab navigation", () => {
    renderComponent();
    
    expect(screen.getByTestId("tab-single-search")).toHaveTextContent("Single Search");
    expect(screen.getByTestId("tab-compare-prompts")).toHaveTextContent("Compare Prompts");
  });

  it("shows single search tab content by default", () => {
    renderComponent();
    
    expect(screen.getByTestId("tab-content-single-search")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-content-compare-prompts")).not.toBeInTheDocument();
  });

  it("switches to compare prompts tab when clicked", () => {
    renderComponent();
    
    fireEvent.click(screen.getByTestId("tab-compare-prompts"));
    
    expect(screen.getByTestId("tab-content-compare-prompts")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-content-single-search")).not.toBeInTheDocument();
    expect(screen.getByTestId("semantic-search-compare")).toBeInTheDocument();
  });

  it("passes empty workspace ID to compare component initially", () => {
    renderComponent();
    
    fireEvent.click(screen.getByTestId("tab-compare-prompts"));
    
    expect(screen.getByTestId("semantic-search-compare")).toHaveTextContent("Compare component with workspace:");
  });
});
