import * as React from 'react';

export const Container = ({ children }: any) =>
  React.createElement('div', { 'data-testid': 'container' }, children);

export const Header = ({ children }: any) =>
  React.createElement('h1', { 'data-testid': 'header' }, children);

export const SpaceBetween = ({ children }: any) =>
  React.createElement('div', { 'data-testid': 'space-between' }, children);

export const Button = ({ children, onClick, disabled, variant }: any) =>
  React.createElement('button', {
    'data-testid': 'button',
    className: variant ? `awsui-button-variant-${variant}` : '',
    onClick,
    disabled
  }, children);

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

export const Form = ({ children }: any) =>
  React.createElement('form', { 'data-testid': 'form' }, children);

export const FormField = ({ label, children }: any) =>
  React.createElement('div', { 'data-testid': 'form-field' },
    React.createElement('label', {}, label),
    children
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
