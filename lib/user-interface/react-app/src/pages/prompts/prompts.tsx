import { useState, useEffect } from 'react';
import { Container, Header, SpaceBetween, Button, Table, Modal, Form, FormField, Input, Textarea, HelpPanel } from '@cloudscape-design/components';
import { useNavigate, Link } from 'react-router-dom';
import BaseAppLayout from "../../components/base-app-layout";

interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export default function Prompts() {
  const navigate = useNavigate();
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

  const handleUse = (prompt: Prompt) => {
    // Store the selected prompt information in sessionStorage for the chat to pick up
    sessionStorage.setItem('selectedPrompt', prompt.content);
    sessionStorage.setItem('selectedPromptId', prompt.id);
    sessionStorage.setItem('selectedPromptName', prompt.name);
    // Navigate to chat playground
    navigate('/chatbot/playground');
  };

  return (
    <BaseAppLayout
      info={
        <HelpPanel header={<Header variant="h3">Prompt Management</Header>}>
          <p>
            Create and manage reusable prompt templates for your conversations. 
            You can create, edit, and organize prompts that can be used in the{" "}
            <Link to="/chatbot/playground">Chat Playground</Link>.
          </p>
          <h3>Creating Prompts</h3>
          <p>
            Click "Create Prompt" to add a new template. Give it a descriptive name 
            and write your prompt content. You can include instructions, context, 
            or any text that you want to reuse across conversations.
          </p>
          <h3>Using Prompts</h3>
          <p>
            Click "Use" on any prompt to navigate to the chat with that prompt 
            pre-loaded. The prompt will appear in the template area where you 
            can further customize it before adding your specific question.
          </p>
        </HelpPanel>
      }
      toolsWidth={300}
      content={
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
                      <Button variant="primary" onClick={() => handleUse(item)}>Use</Button>
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
      }
    />
  );
}
