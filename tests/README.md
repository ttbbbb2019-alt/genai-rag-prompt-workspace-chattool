# Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the GenAI Chatbot project, including unit tests, integration tests, and end-to-end testing strategies.

## Test Structure

```
tests/
├── unit/                           # Unit tests
│   ├── test_basic_functionality.py # Python basic functionality tests
│   └── basic-functionality.test.ts # TypeScript basic functionality tests
├── integration/                    # Integration tests
│   ├── test_chatbot_workflow.py   # Complete chatbot workflow tests
│   ├── test_bedrock_integration.py # Bedrock model integration tests
│   └── infrastructure.test.ts     # CDK infrastructure tests
├── chatbot-api/                   # Existing API tests
│   └── functions/                 # Lambda function tests
├── conftest.py                    # Pytest configuration
└── README.md                      # This documentation
```

## Test Categories

### 1. Unit Tests

**Python Unit Tests** (`tests/unit/test_basic_functionality.py`)
- Environment variable handling
- JSON serialization/deserialization
- String and data structure operations
- Basic Python functionality validation

**TypeScript Unit Tests** (`tests/unit/basic-functionality.test.ts`)
- JSON operations
- String manipulations
- Array and object handling
- Environment variable management

### 2. Integration Tests

**Chatbot Workflow Tests** (`tests/integration/test_chatbot_workflow.py`)
- Complete chat session lifecycle
- Document upload and processing
- Database integration with DynamoDB
- S3 bucket operations
- Health check endpoints

**Bedrock Integration Tests** (`tests/integration/test_bedrock_integration.py`)
- Bedrock client initialization
- Model invocation testing
- Permission error handling
- Live integration tests (requires Bedrock access approval)

**Infrastructure Tests** (`tests/integration/infrastructure.test.ts`)
- CDK stack validation
- AWS resource creation verification
- Lambda function deployment
- Cognito, DynamoDB, CloudFront, AppSync testing

### 3. Existing API Tests

The project already includes comprehensive API route tests:
- Documents API (`tests/chatbot-api/functions/api-handler/routes/documents_test.py`)
- Sessions API (`tests/chatbot-api/functions/api-handler/routes/sessions_test.py`)
- Workspaces API (`tests/chatbot-api/functions/api-handler/routes/workspaces_test.py`)
- And many more route-specific tests

## Running Tests

### Python Tests
```bash
# Run all Python tests
npm run pytest

# Run specific test files
python -m pytest tests/unit/test_basic_functionality.py -v
python -m pytest tests/integration/ -v

# Run with coverage
python -m pytest --cov=lib --cov-report=html
```

### TypeScript Tests
```bash
# Run all TypeScript tests
npm test

# Run specific test files
npm test -- tests/unit/basic-functionality.test.ts
npm test -- tests/integration/infrastructure.test.ts

# Run with watch mode
npm test -- --watch
```

### All Tests
```bash
# Run complete test suite
npm run test-all
```

## Test Configuration

### Pytest Configuration (`conftest.py`)
- Sets up Python path for imports
- Configures AWS environment variables
- Provides shared test fixtures

### Jest Configuration (`package.json`)
- TypeScript test compilation
- Test file patterns
- Coverage reporting
- Snapshot testing support

## Bedrock Integration Testing

**Important Note**: Bedrock integration tests are currently skipped because Bedrock access requires AWS approval for enterprise customers. As mentioned in the conversation summary:

- Bedrock access application is free but requires AWS approval
- The chatbot infrastructure is successfully deployed
- AI functionality is blocked by missing Bedrock permissions
- Tests will be enabled once Bedrock access is granted

## Test Dependencies

### Python Dependencies
- pytest: Test framework
- moto: AWS service mocking
- unittest.mock: Python mocking library

### TypeScript Dependencies  
- jest: Test framework
- ts-jest: TypeScript compilation
- @types/jest: TypeScript definitions

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on external state
2. **Mocking**: External services are mocked to ensure reliable testing
3. **Coverage**: Tests cover both success and error scenarios
4. **Documentation**: Each test includes clear descriptions of what it validates
5. **Environment**: Tests use environment variables for configuration

## Future Enhancements

1. **End-to-End Tests**: Browser automation tests for the React UI
2. **Performance Tests**: Load testing for API endpoints
3. **Security Tests**: Authentication and authorization validation
4. **Live Integration**: Real Bedrock model testing once access is approved

## Troubleshooting

### Common Issues

1. **Module Import Errors**: Ensure Python path is correctly configured in conftest.py
2. **Docker/Finch Issues**: Infrastructure tests may fail if Docker isn't available
3. **AWS Credentials**: Integration tests require valid AWS credentials for mocking
4. **Bedrock Access**: Model integration tests are skipped until AWS approval

### Getting Help

- Check test output for specific error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Review the conversation summary for context on Bedrock access requirements
