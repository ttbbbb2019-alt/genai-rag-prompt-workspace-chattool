# GenAI RAG Prompt Workspace Chattool

A GenAI-powered RAG workspace chattool with intelligent prompt management for interactive problem-solving through conversational I/O.

## Features

- **Original AWS GenAI LLM Chatbot functionality**
  - Multi-LLM support (Bedrock, SageMaker, etc.)
  - RAG (Retrieval Augmented Generation)
  - Conversation memory
  - Enterprise security

- **Enhanced Prompt Management** ✨
  - Create and manage prompt templates
  - Edit existing prompts
  - Delete unused prompts
  - Local storage for prompt persistence

## Quick Start

1. **Deploy the infrastructure:**
   ```bash
   npm install
   npx cdk deploy --require-approval never
   ```

2. **Access your chatbot:**
   - Website will be available at the CloudFront URL shown in deployment outputs
   - Navigate to "Chatbot" → "Prompts" to manage your prompt templates

## Testing

Comprehensive test suite including unit tests, integration tests, and infrastructure validation.

📋 **[View Test Documentation](tests/README.md)**

## Architecture

Based on the AWS GenAI LLM Chatbot solution with custom prompt management interface added.

## License

MIT License - This is a custom implementation based on the original AWS solution.
