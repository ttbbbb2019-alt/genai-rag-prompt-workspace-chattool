# GenAI RAG Prompt Workspace Chattool

🚀 A GenAI-powered RAG workspace chattool with intelligent prompt management for interactive problem-solving through conversational I/O.

## ✨ Key Features

### 🤖 Advanced AI Capabilities
- **Multi-LLM Support**: Bedrock, SageMaker, OpenAI, and more
- **RAG (Retrieval Augmented Generation)**: Enhanced responses with knowledge base integration
- **Conversation Memory**: Persistent chat history and context awareness
- **Real-time Streaming**: Live response generation for better user experience

### 🎯 Intelligent Prompt Management
- **Create Custom Prompts**: Design specialized prompt templates for different use cases
- **Edit & Refine**: Modify existing prompts to optimize performance
- **Template Library**: Organize and categorize prompt templates
- **Version Control**: Track prompt changes and iterations
- **Import/Export**: Share prompt templates across workspaces

### 🏢 Workspace Management
- **Multi-Workspace Support**: Create and manage separate workspaces for different projects
- **Team Collaboration**: Share workspaces with team members
- **Role-based Access**: Control permissions and access levels
- **Workspace Templates**: Quick setup with pre-configured environments
- **Resource Isolation**: Separate knowledge bases and configurations per workspace

### 💬 Interactive Problem-Solving
- **Conversational I/O**: Natural language input/output for complex problem solving
- **Context-Aware Responses**: Maintains conversation context across interactions
- **Multi-turn Conversations**: Handle complex, multi-step problem resolution
- **Rich Media Support**: Handle text, images, documents, and structured data
- **Export Conversations**: Save and share problem-solving sessions

### 🔧 Enterprise Features
- **AWS Integration**: Native AWS services integration (S3, DynamoDB, Lambda, etc.)
- **Security & Compliance**: Enterprise-grade security with AWS IAM
- **Scalable Architecture**: Auto-scaling infrastructure on AWS
- **Monitoring & Logging**: Comprehensive observability with CloudWatch
- **API Access**: RESTful APIs for programmatic integration

### 📊 Analytics & Insights
- **Usage Analytics**: Track workspace and prompt usage patterns
- **Performance Metrics**: Monitor response times and accuracy
- **Cost Optimization**: Track and optimize AI model usage costs
- **User Behavior**: Understand how teams interact with the system

## 🚀 Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+ and npm
- AWS CDK v2 installed
- Python 3.9+ (for backend functions)

### 1. Clone and Setup
```bash
git clone https://github.com/ttbbbb2019-alt/genai-rag-prompt-workspace-chattool.git
cd genai-rag-prompt-workspace-chattool
npm install
```

### 2. Configure AWS
```bash
# Configure your AWS credentials
aws configure

# Bootstrap CDK (if first time)
npx cdk bootstrap
```

### 3. Deploy Infrastructure
```bash
# Deploy all stacks
npx cdk deploy --require-approval never

# Or deploy specific stacks
npx cdk deploy ChatbotStack
```

### 4. Access Your Application
- Website URL will be shown in deployment outputs
- Navigate to "Workspaces" to create your first workspace
- Go to "Prompts" to manage prompt templates
- Start chatting in the "Chatbot" interface

## 📖 Usage Examples

### Creating a Workspace
1. Navigate to "Workspaces" → "Create New"
2. Choose a template or start from scratch
3. Configure knowledge base sources
4. Set team permissions and access

### Managing Prompts
1. Go to "Prompts" → "Create Template"
2. Define your prompt with variables: `{{variable_name}}`
3. Test with sample inputs
4. Save and organize in categories

### Problem-Solving Session
1. Select your workspace
2. Choose relevant prompt template
3. Start conversational interaction
4. Export results or continue in new session

## 🧪 Testing

Comprehensive test suite with 95%+ coverage:

```bash
# Run all tests
npm run test-all

# Unit tests only
npm run test
npm run pytest

# Integration tests
npm run test:integration

# UI tests
npm run test:ui
```

📋 **[View Detailed Test Documentation](tests/README.md)**

## 🏗️ Architecture

### Frontend
- **React + TypeScript**: Modern, responsive web interface
- **AWS Amplify**: Authentication and API integration
- **Material-UI**: Consistent design system

### Backend
- **AWS Lambda**: Serverless compute for API endpoints
- **Amazon Bedrock**: AI model access and management
- **DynamoDB**: NoSQL database for conversations and prompts
- **S3**: Document storage and knowledge base
- **CloudFront**: Global content delivery

### Infrastructure
- **AWS CDK**: Infrastructure as Code
- **API Gateway**: RESTful API management
- **Cognito**: User authentication and authorization
- **CloudWatch**: Monitoring and logging

## 🔧 Configuration

### Environment Variables
```bash
# Copy example configuration
cp .env.example .env

# Configure your settings
BEDROCK_REGION=us-east-1
KNOWLEDGE_BASE_BUCKET=your-kb-bucket
DEFAULT_MODEL=anthropic.claude-v2
```

### Custom Models
Add support for additional AI models by updating:
- `lib/model-interfaces/`
- `lib/chatbot-api/functions/`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/ttbbbb2019-alt/genai-rag-prompt-workspace-chattool/issues)
- 💬 [Discussions](https://github.com/ttbbbb2019-alt/genai-rag-prompt-workspace-chattool/discussions)

## 🙏 Acknowledgments

Built upon the AWS GenAI LLM Chatbot solution with significant enhancements for workspace management and prompt engineering capabilities.
