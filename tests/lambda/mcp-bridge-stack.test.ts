import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MCPBridgeStack } from '../../lib/aws-mcp-lambda/mcp-bridge-stack';

describe('MCPBridgeStack', () => {
  let app: cdk.App;
  let stack: MCPBridgeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MCPBridgeStack(app, 'TestMCPBridgeStack');
    template = Template.fromStack(stack);
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'handler.handler',
        Timeout: 30,
        MemorySize: 512
      });
    });

    test('should have required environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            GENAI_GRAPHQL_URL: 'https://test-appsync-api.amazonaws.com/graphql',
            GENAI_API_KEY_SECRET: 'test-api-key-secret',
            APPSYNC_API_ID: 'test-api-id'
          }
        }
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should create Lambda role with minimal required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should have required IAM policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [{
          PolicyName: 'MCPBridgePolicy'
        }]
      });
    });
  });

  describe('API Gateway', () => {
    test('should create WebSocket API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'genai-mcp-bridge',
        ProtocolType: 'WEBSOCKET'
      });
    });

    test('should create HTTP API with CORS', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'genai-mcp-bridge-http',
        ProtocolType: 'HTTP',
        CorsConfiguration: {
          AllowOrigins: ['*'],
          AllowMethods: ['*'],
          AllowHeaders: ['*']
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('WebSocketApiUrl', {});
      template.hasOutput('HttpApiUrl', {});
      template.hasOutput('UserPoolId', {});
      template.hasOutput('UserPoolClientId', {});
      template.hasOutput('JWTSecretArn', {});
    });
  });
});
