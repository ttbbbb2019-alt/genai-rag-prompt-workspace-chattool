# AWS MCP Lambda Bridge

This project provides a complete Model Context Protocol (MCP) implementation, including AWS Lambda backend and CLI client, enabling you to connect and use GenAI services through standardized protocols.

## 🏗️ Architecture Overview

### AWS Lambda MCP Server
- **Lambda Function**: Handles MCP protocol requests
- **API Gateway**: WebSocket and HTTP interfaces
- **Cognito Authentication**: User identity verification
- **AppSync Integration**: Connects to GenAI GraphQL API

### MCP Client
- **CLI Tool**: Command-line interface
- **WebSocket Connection**: Real-time communication
- **Multi-Server Management**: Connect to multiple servers simultaneously
- **Interactive Chat**: Conversation with AI models

## 🚀 Core Features

- **Standard MCP Protocol**: Fully compatible with MCP 2024-11-05 specification
- **AWS Native Integration**: Leverages AWS services for authentication and API calls
- **Real-time Communication**: WebSocket support for real-time messaging
- **Secure Authentication**: Cognito JWT token validation
- **Tool Invocation**: Access various tools provided by GenAI services
- **Configuration Persistence**: Automatically save server configurations

## 📦 Deploy AWS MCP Server

### 1. Deploy Lambda Function

```bash
# Deploy MCP Bridge Stack
npx cdk deploy MCPBridgeStack

# Get deployment outputs
aws cloudformation describe-stacks --stack-name MCPBridgeStack --query 'Stacks[0].Outputs'
```

### 2. Configure Environment Variables

Lambda function requires the following environment variables:
- `GENAI_GRAPHQL_URL`: GenAI GraphQL API endpoint
- `USER_POOL_ID`: Cognito user pool ID
- `JWT_SECRET_ARN`: JWT secret ARN
- `APPSYNC_API_ID`: AppSync API ID

### 3. Create User

```bash
# Create Cognito user
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username <USERNAME> \
  --temporary-password <TEMP_PASSWORD> \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username <USERNAME> \
  --password <PERMANENT_PASSWORD> \
  --permanent
```

## 🎯 Using MCP Client

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Client

```bash
# Add AWS MCP server
./bin/genai-chat.js mcp add-server aws-prod wss://your-api-id.execute-api.region.amazonaws.com/prod

# Set authentication info (requires Cognito JWT token)
export MCP_AUTH_TOKEN="your-jwt-token"
```

### 3. Get Authentication Token

```bash
# Use AWS CLI to get Cognito token
aws cognito-idp admin-initiate-auth \
  --user-pool-id <USER_POOL_ID> \
  --client-id <CLIENT_ID> \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<username>,PASSWORD=<password>
```

## 🔧 MCP Command Reference

### Server Management
```bash
# Add server
./bin/genai-chat.js mcp add-server <name> <url> [options]

# Remove server
./bin/genai-chat.js mcp remove-server <name>

# List all servers
./bin/genai-chat.js mcp list-servers

# Set active server
./bin/genai-chat.js mcp set-active <name>
```

### Tool Operations
```bash
# List all tools
./bin/genai-chat.js mcp list-tools

# Call tool
./bin/genai-chat.js mcp call-tool <name>

# Call tool with arguments
./bin/genai-chat.js mcp call-tool echo --args '{"message": "Hello World"}'
```

### Chat Functionality
```bash
# Send single message
./bin/genai-chat.js mcp chat "Hello, please help me understand AWS Lambda"

# Specify model and parameters
./bin/genai-chat.js mcp chat "Hello" --model gpt-4 --temperature 0.5
```

## 💬 Interactive Mode

Start interactive mode:
```bash
./bin/genai-chat.js
```

### Interactive Commands

- `/help` - Show help information
- `/servers` - List connected servers
- `/tools` - List available tools
- `/use <server>` - Switch to specified server
- `/tool <name> [args]` - Call tool
- `/history` - Show conversation history
- `/reset` - Clear conversation history
- `/clear` - Clear screen
- `/quit` or `/exit` - Exit

### Example Interactive Session

```
genai-chat> Hello, can you help me understand AWS services?
🤖 Response: Of course! AWS provides a rich set of cloud services...

genai-chat> /tools
🔧 Available Tools:
  Server: demo-server
    • echo: Echo back the input message
    • get-time: Get current time
    • calculate: Perform basic arithmetic

genai-chat> /tool calculate {"operation": "add", "a": 10, "b": 20}
🔧 Calling tool: calculate
✅ Tool execution completed:
{
  "operation": "add",
  "a": 10,
  "b": 20,
  "result": 30
}

genai-chat> /quit
👋 Goodbye!
```

## 🏗️ AWS Lambda MCP Implementation

### Core Components

1. **MCPLambdaBridge** (`lib/aws-mcp-lambda/handler.js`)
   - MCP protocol handling
   - GenAI GraphQL API integration
   - AWS signature authentication

2. **MCPBridgeStack** (`lib/aws-mcp-lambda/mcp-bridge-stack.ts`)
   - CDK infrastructure definition
   - API Gateway WebSocket/HTTP configuration
   - Cognito user pool and authentication

3. **Lambda Function** (`lib/aws-mcp-lambda/index.js`)
   - WebSocket connection management
   - HTTP request handling
   - Error handling and logging

### MCP Protocol Support

Implemented MCP methods:
- `initialize` - Protocol initialization
- `tools/list` - List available tools
- `tools/call` - Execute tool calls

### GenAI Integration

```javascript
// Call GenAI GraphQL API
const query = `
  mutation Chat($input: ChatInput!) {
    chat(input: $input) {
      id
      content
    }
  }
`;

const variables = {
  input: {
    messages: [{ role: "user", content: "Hello" }]
  }
};
```

## 🔧 Configuration and Deployment

### CDK Deployment Configuration

```typescript
// MCP Bridge Stack Configuration
export class MCPBridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'MCPUserPool', {
      userPoolName: 'genai-mcp-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: true }
    });

    // Lambda Function
    const mcpBridgeFunction = new lambda.Function(this, 'MCPBridgeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('./lib/aws-mcp-lambda'),
      environment: {
        GENAI_GRAPHQL_URL: 'https://your-appsync-api.amazonaws.com/graphql',
        USER_POOL_ID: userPool.userPoolId
      }
    });

    // WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'MCPWebSocketApi', {
      apiName: 'genai-mcp-bridge'
    });
  }
}
```

### Environment Variables Configuration

Lambda function environment variables:
```bash
GENAI_GRAPHQL_URL=https://your-appsync-api.amazonaws.com/graphql
USER_POOL_ID=region_xxxxxxxxx
JWT_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:jwt-secret
APPSYNC_API_ID=your-api-id
```

## 🔌 MCP Protocol Specification

### Supported Methods

1. **initialize**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "initialize",
     "params": {
       "protocolVersion": "2024-11-05",
       "capabilities": {
         "tools": { "listChanged": true }
       }
     }
   }
   ```

2. **tools/list**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/list",
     "id": 1
   }
   ```

3. **tools/call**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "chat",
       "arguments": {
         "messages": [
           { "role": "user", "content": "Hello" }
         ]
       }
     },
     "id": 2
   }
   ```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "AI response here"
      }
    ]
  }
}
```

## 🧪 Testing and Development

### Local Testing

```bash
# Run Lambda function local tests
npm test

# Start local development server
npm run dev

# Test MCP protocol
node test-mcp.js
```

### Deployment Testing

```bash
# Deploy to AWS
npx cdk deploy MCPBridgeStack

# Test WebSocket connection
wscat -c wss://your-api-id.execute-api.region.amazonaws.com/prod

# Test HTTP endpoint
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Monitoring and Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/MCPBridgeFunction --follow

# View API Gateway logs
aws logs tail /aws/apigateway/mcp-websocket-api --follow
```

## 🚀 Production Deployment

### 1. Connect to Remote Server

```bash
# Add production server
./bin/genai-chat.js mcp add-server production wss://your-genai-server.com/mcp --timeout 60000

# Set as active server
./bin/genai-chat.js mcp set-active production
```

### 2. Using AWS Lambda + API Gateway

If your MCP server is deployed on AWS Lambda:

```bash
./bin/genai-chat.js mcp add-server aws-lambda wss://your-api-id.execute-api.region.amazonaws.com/stage
```

## 🔧 Troubleshooting

### Connection Issues
1. Check if server URL is correct
2. Confirm server is running
3. Check firewall settings
4. Try increasing timeout

### Tool Execution Errors
1. Use `/tools` to confirm tool exists
2. Check parameter format
3. Confirm permission settings

### Chat Issues
1. Confirm server supports chat functionality
2. Check model parameter requirements
3. Adjust temperature and other parameters

## 📚 More Documentation

- [Detailed Usage Guide](docs/MCP_USAGE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Development Guide](docs/DEVELOPMENT.md)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📄 License

MIT License
