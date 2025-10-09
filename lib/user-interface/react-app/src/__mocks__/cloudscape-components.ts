import * as React from 'react';

export const Container = ({ children, header }: any) =>
  React.createElement('div', { 'data-testid': 'container' }, 
    header && React.createElement('div', { 'data-testid': 'container-header' }, header),
    children
  );

export const Header = ({ children, variant, description }: any) =>
  React.createElement('div', {},
    React.createElement('h1', { 'data-testid': 'header', className: variant ? `header-${variant}` : '' }, children),
    description && React.createElement('div', { 'data-testid': 'header-description' }, description)
  );

export const SpaceBetween = ({ children }: any) =>
  React.createElement('div', { 'data-testid': 'space-between' }, children);

export const Button = ({ children, onClick, disabled, variant, iconName }: any) =>
  React.createElement('button', {
    'data-testid': 'button',
    className: variant ? `awsui-button-variant-${variant}` : '',
    onClick,
    disabled,
    'aria-label': iconName || undefined,
    name: iconName || undefined
  }, children || iconName);

export const ButtonGroup = ({ items }: any) =>
  React.createElement('div', { 'data-testid': 'button-group' },
    items?.map((item: any, idx: number) =>
      React.createElement('button', { key: idx, onClick: item.onClick }, item.text)
    )
  );

export const Box = ({ children, padding, className }: any) =>
  React.createElement('div', { 
    'data-testid': 'box',
    className: className || '',
    style: padding ? { padding: '8px' } : {}
  }, children);

export const StatusIndicator = ({ type, children }: any) =>
  React.createElement('span', { 
    'data-testid': 'status-indicator',
    className: `status-${type}`
  }, children);

export const Table = ({ items, columnDefinitions, empty }: any) =>
  React.createElement('div', { 'data-testid': 'table' },
    items?.length ? 
      React.createElement('table', {},
        React.createElement('thead', {},
          React.createElement('tr', {},
            columnDefinitions?.map((col: any, idx: number) =>
              React.createElement('th', { key: idx }, col.header)
            )
          )
        ),
        React.createElement('tbody', {},
          items?.map((item: any, idx: number) =>
            React.createElement('tr', { key: idx },
              columnDefinitions?.map((col: any, colIdx: number) =>
                React.createElement('td', { key: colIdx }, 
                  col.cell ? col.cell(item) : item[col.id]
                )
              )
            )
          )
        )
      ) :
      React.createElement('div', {}, empty)
  );

export const Modal = ({ visible, header, children, footer, onDismiss }: any) =>
  visible ? React.createElement('div', { 'data-testid': 'modal' },
    React.createElement('div', {}, header),
    React.createElement('div', {}, children),
    React.createElement('div', {}, footer),
    React.createElement('button', { onClick: onDismiss }, 'Close')
  ) : null;

export const Form = ({ children, actions }: any) =>
  React.createElement('form', { 
    'data-testid': 'form',
    onSubmit: (e: any) => e.preventDefault() // Prevent form submission to avoid JSDOM issues
  }, 
    children,
    actions && React.createElement('div', { 'data-testid': 'form-actions' }, actions)
  );

export const FormField = ({ label, children, secondaryControl }: any) =>
  React.createElement('div', { 'data-testid': 'form-field' },
    React.createElement('label', {}, label),
    children,
    secondaryControl
  );

export const Input = ({ value, onChange, placeholder }: any) =>
  React.createElement('input', {
    'data-testid': 'input',
    value,
    onChange: (e: any) => onChange?.({ detail: { value: e.target.value } }),
    placeholder
  });

export const Textarea = ({ value, onChange, placeholder }: any) =>
  React.createElement('textarea', {
    'data-testid': 'textarea',
    value,
    onChange: (e: any) => onChange?.({ detail: { value: e.target.value } }),
    placeholder
  });

export const Toggle = ({ checked, onChange }: any) =>
  React.createElement('input', {
    type: 'checkbox',
    'data-testid': 'toggle',
    checked,
    onChange: (e: any) => onChange?.({ detail: { checked: e.target.checked } })
  });

export const Select = ({ selectedOption, onChange, options, placeholder }: any) =>
  React.createElement('select', {
    'data-testid': 'select',
    value: selectedOption?.value || '',
    onChange: (e: any) => {
      const option = options?.find((opt: any) => opt.value === e.target.value);
      onChange?.({ detail: { selectedOption: option } });
    }
  },
    React.createElement('option', { value: '' }, placeholder),
    options?.map((option: any, idx: number) =>
      React.createElement('option', { key: idx, value: option.value }, option.label)
    )
  );

export const PromptInput = ({ value, onChange, onAction, disabled }: any) =>
  React.createElement('div', { 'data-testid': 'prompt-input' },
    React.createElement('textarea', {
      value,
      onChange: (e: any) => onChange?.({ detail: { value: e.target.value } }),
      placeholder: 'Enter your message...',
      rows: 4
    }),
    React.createElement('button', { onClick: onAction, disabled }, 'Send')
  );

export const Alert = ({ type, children, dismissible, onDismiss, header }: any) =>
  React.createElement('div', { 
    'data-testid': 'alert',
    className: `alert-${type}`
  },
    header && React.createElement('div', { 'data-testid': 'alert-header' }, header),
    React.createElement('div', {}, children),
    dismissible && React.createElement('button', { 
      onClick: onDismiss,
      'aria-label': 'dismiss'
    }, '×')
  );

export const Tabs = ({ tabs }: any) =>
  React.createElement('div', { 'data-testid': 'tabs' },
    tabs?.map((tab: any, idx: number) =>
      React.createElement('div', { key: idx },
        React.createElement('button', {}, tab.label),
        React.createElement('div', {}, tab.content)
      )
    )
  );

export const ExpandableSection = ({ headerText, children }: any) =>
  React.createElement('div', { 'data-testid': 'expandable-section' },
    React.createElement('button', {}, headerText),
    React.createElement('div', {}, children)
  );

// Mock components for semantic search
export const ResultItems = ({ searchResult, searchQuery }: any) =>
  React.createElement('div', { 'data-testid': 'result-items' },
    React.createElement('div', {}, `Results for: ${searchQuery}`),
    React.createElement('div', {}, `Found ${searchResult?.items?.length || 0} items`)
  );

export const SemanticSearchDetails = ({ searchResults }: any) =>
  React.createElement('div', { 'data-testid': 'semantic-search-details' },
    React.createElement('div', {}, 'Search Details'),
    React.createElement('div', {}, `Engine: ${searchResults?.engine || 'opensearch'}`)
  );
