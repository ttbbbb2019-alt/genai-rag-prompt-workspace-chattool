import { useState, useEffect } from 'react';
import { Container, Header, SpaceBetween, Button, Table, Modal, Form, FormField, Input, Textarea } from '@cloudscape-design/components';

interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  useEffect(() => {
    // Load prompts from localStorage
    const saved = localStorage.getItem('chatbot-prompts');
    if (saved) {
      setPrompts(JSON.parse(saved));
    }
  }, []);

  const savePrompts = (newPrompts: Prompt[]) => {
    setPrompts(newPrompts);
    localStorage.setItem('chatbot-prompts', JSON.stringify(newPrompts));
  };

  const handleSave = () => {
    if (!formData.name || !formData.content) return;

    if (editingPrompt) {
      const updated = prompts.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, name: formData.name, content: formData.content }
          : p
      );
      savePrompts(updated);
    } else {
      const newPrompt: Prompt = {
        id: Date.now().toString(),
        name: formData.name,
        content: formData.content,
        createdAt: new Date().toISOString()
      };
      savePrompts([...prompts, newPrompt]);
    }

    setShowModal(false);
    setEditingPrompt(null);
    setFormData({ name: '', content: '' });
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({ name: prompt.name, content: prompt.content });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    savePrompts(prompts.filter(p => p.id !== id));
  };

  return (
    <Container>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button
              variant="primary"
              onClick={() => {
                setEditingPrompt(null);
                setFormData({ name: '', content: '' });
                setShowModal(true);
              }}
            >
              Create Prompt
            </Button>
          }
        >
          Prompt Management
        </Header>

        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Name',
              cell: (item: Prompt) => item.name,
            },
            {
              id: 'content',
              header: 'Content',
              cell: (item: Prompt) => item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
            },
            {
              id: 'createdAt',
              header: 'Created',
              cell: (item: Prompt) => new Date(item.createdAt).toLocaleDateString(),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item: Prompt) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => handleEdit(item)}>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)}>Delete</Button>
                </SpaceBetween>
              ),
            },
          ]}
          items={prompts}
          empty="No prompts found. Create your first prompt to get started."
        />

        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          header={editingPrompt ? 'Edit Prompt' : 'Create Prompt'}
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                {editingPrompt ? 'Update' : 'Create'}
              </Button>
            </SpaceBetween>
          }
        >
          <Form>
            <SpaceBetween size="l">
              <FormField label="Name">
                <Input
                  value={formData.name}
                  onChange={({ detail }) => setFormData({ ...formData, name: detail.value })}
                  placeholder="Enter prompt name"
                />
              </FormField>
              <FormField label="Content">
                <Textarea
                  value={formData.content}
                  onChange={({ detail }) => setFormData({ ...formData, content: detail.value })}
                  placeholder="Enter prompt content"
                  rows={10}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    </Container>
  );
}
