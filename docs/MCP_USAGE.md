# MCP (Model Context Protocol) Usage Guide

This document explains how to use the MCP functionality in the GenAI Chat CLI tool.

## Overview

The MCP integration allows you to connect to remote GenAI servers that implement the Model Context Protocol, enabling you to:

- Connect to multiple GenAI servers simultaneously
- Switch between different servers
- Access server-specific tools and capabilities
- Maintain conversation context across interactions

## Quick Start

### 1. Add an MCP Server

```bash
# Add a server with default settings
./bin/genai-chat.js mcp add-server my-server ws://localhost:8080

# Add a server with custom timeout and retry settings
./bin/genai-chat.js mcp add-server my-server ws://localhost:8080 --timeout 60000 --retries 5
```

### 2. List Available Servers

```bash
./bin/genai-chat.js mcp list-servers
```

### 3. Set Active Server

```bash
./bin/genai-chat.js mcp set-active my-server
```

### 4. List Available Tools

```bash
./bin/genai-chat.js mcp list-tools
```

### 5. Start Interactive Chat

```bash
./bin/genai-chat.js
```

## Command Reference

### Server Management

- `mcp add-server <name> <url>` - Add a new MCP server
- `mcp remove-server <name>` - Remove an MCP server
- `mcp list-servers` - List all configured servers
- `mcp set-active <name>` - Set the active server

### Tool Operations

- `mcp list-tools` - List all available tools from connected servers
- `mcp call-tool <name>` - Call a specific tool
- `mcp call-tool <name> --args '{"param": "value"}'` - Call a tool with arguments

### Chat Operations

- `mcp chat "your message"` - Send a single chat message
- `mcp chat "your message" --model gpt-4` - Specify a model
- `mcp chat "your message" --temperature 0.5` - Set temperature

## Interactive Mode

When you run `./bin/genai-chat.js` without arguments, you enter interactive mode with MCP support.

### Interactive Commands

- `/help` - Show available commands
- `/servers` - List connected MCP servers
- `/tools` - List available tools
- `/use <server>` - Switch to a different server
- `/tool <name> [args]` - Call a tool
- `/history` - Show conversation history
- `/reset` - Clear conversation history
- `/clear` - Clear screen
- `/quit` or `/exit` - Exit the chat

### Example Interactive Session

```
genai-chat> Hello, can you help me with AWS?
🤖 Response: Of course! I can help you with AWS services, best practices, and troubleshooting...

genai-chat> /tools
🔧 Available Tools:
  Server: aws-server
    • describe-instances: List EC2 instances
    • create-bucket: Create S3 bucket
    • list-functions: List Lambda functions

genai-chat> /tool describe-instances {"region": "us-east-1"}
🔧 Calling tool: describe-instances
✅ Tool execution completed:
{
  "instances": [...]
}

genai-chat> /quit
👋 Goodbye!
```

## Configuration

MCP servers are automatically saved to `~/.genai-chat/mcp-config.json`. The configuration includes:

```json
{
  "servers": {
    "my-server": {
      "url": "ws://localhost:8080",
      "options": {
        "timeout": 30000,
        "retries": 3
      }
    }
  },
  "activeServer": "my-server",
  "defaultOptions": {
    "timeout": 30000,
    "retries": 3
  }
}
```

## Server Requirements

MCP servers must implement the Model Context Protocol specification:

- WebSocket connection support
- JSON-RPC 2.0 message format
- Standard MCP methods:
  - `tools/list` - List available tools
  - `tools/call` - Execute a tool
  - `chat/completions` - Chat completions (optional)

## Example MCP Server URLs

- Local development: `ws://localhost:8080`
- Remote server: `wss://your-server.com/mcp`
- AWS Lambda with WebSocket API: `wss://api-id.execute-api.region.amazonaws.com/stage`

## Troubleshooting

### Connection Issues

1. Verify the server URL is correct
2. Check if the server is running and accessible
3. Ensure WebSocket connections are allowed through firewalls
4. Try increasing timeout values for slow connections

### Tool Execution Errors

1. Use `/tools` to verify the tool exists
2. Check tool argument format with the server documentation
3. Ensure you have proper permissions for the tool

### Chat Issues

1. Verify the server supports chat completions
2. Check if the model parameter is required
3. Try adjusting temperature and other parameters

## Advanced Usage

### Multiple Servers

You can connect to multiple servers and switch between them:

```bash
# Add multiple servers
./bin/genai-chat.js mcp add-server aws-server ws://aws.example.com/mcp
./bin/genai-chat.js mcp add-server openai-server ws://openai.example.com/mcp

# Switch between servers in interactive mode
genai-chat> /use aws-server
genai-chat> /use openai-server
```

### Server-Specific Tool Calls

```bash
# Call a tool on a specific server
./bin/genai-chat.js mcp call-tool describe-instances --server aws-server --args '{"region": "us-east-1"}'
```

### Programmatic Usage

You can also use the MCP functionality programmatically:

```javascript
const { MCPCLIHandler } = require('./lib/mcp-cli');

const handler = new MCPCLIHandler();
await handler.initialize();
await handler.addServer('my-server', 'ws://localhost:8080');
const result = await handler.callTool('my-tool', { param: 'value' });
```
