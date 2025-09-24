// Mock Cloudscape Design components for testing
export const Container = ({ children }: { children: React.ReactNode }) => <div data-testid="container">{children}</div>;
export const Header = ({ children }: { children: React.ReactNode }) => <h1 data-testid="header">{children}</h1>;
export const SpaceBetween = ({ children }: { children: React.ReactNode }) => <div data-testid="space-between">{children}</div>;
export const Button = ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: string }) => (
  <button data-testid="button" className={variant ? `awsui-button-variant-${variant}` : ''} onClick={onClick}>
    {children}
  </button>
);
export const Table = ({ columnDefinitions, items, empty }: any) => (
  <div data-testid="table">
    {items.length === 0 ? empty : items.map((item: any, index: number) => (
      <div key={index} data-testid="table-row">
        {columnDefinitions.map((col: any) => (
          <div key={col.id} data-testid={`table-cell-${col.id}`}>
            {typeof col.cell === 'function' ? col.cell(item) : item[col.id]}
          </div>
        ))}
      </div>
    ))}
  </div>
);
export const Modal = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => 
  visible ? <div data-testid="modal">{children}</div> : null;
export const Form = ({ children }: { children: React.ReactNode }) => <form data-testid="form">{children}</form>;
export const FormField = ({ children }: { children: React.ReactNode }) => <div data-testid="form-field">{children}</div>;
export const Input = ({ value, onChange }: { value: string; onChange: (event: { detail: { value: string } }) => void }) => (
  <input data-testid="input" value={value} onChange={(e) => onChange({ detail: { value: e.target.value } })} />
);
export const Textarea = ({ value, onChange }: { value: string; onChange: (event: { detail: { value: string } }) => void }) => (
  <textarea data-testid="textarea" value={value} onChange={(e) => onChange({ detail: { value: e.target.value } })} />
);
export const Box = ({ children }: { children: React.ReactNode }) => <div data-testid="box">{children}</div>;
export const Select = ({ selectedOption, onChange }: any) => (
  <select data-testid="select" value={selectedOption?.value} onChange={(e) => onChange({ detail: { selectedOption: { value: e.target.value } } })}>
    <option value="">Select...</option>
  </select>
);
export const PromptInput = ({ value, onChange, placeholder }: any) => (
  <input data-testid="prompt-input" value={value} placeholder={placeholder} onChange={(e) => onChange({ detail: { value: e.target.value } })} />
);
export const StatusIndicator = ({ children }: { children: React.ReactNode }) => <span data-testid="status-indicator">{children}</span>;
export const ButtonGroup = ({ children }: { children: React.ReactNode }) => <div data-testid="button-group">{children}</div>;
export const FileTokenGroup = ({ children }: { children: React.ReactNode }) => <div data-testid="file-token-group">{children}</div>;
