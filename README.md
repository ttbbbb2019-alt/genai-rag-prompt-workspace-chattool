# My GenAI Chatbot with Prompt Management

A customized AWS GenAI LLM Chatbot with enhanced prompt management capabilities.

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

## Architecture

Based on the AWS GenAI LLM Chatbot solution with custom prompt management interface added.

## License

MIT License - This is a custom implementation based on the original AWS solution.
