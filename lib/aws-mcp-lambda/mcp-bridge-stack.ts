import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class MCPBridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- JWT Secret for authentication ---
    const jwtSecret = new secretsmanager.Secret(this, 'JWTSecret', {
      description: 'JWT secret for MCP bridge authentication',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ key: '' }),
        generateStringKey: 'key',
        excludeCharacters: '"@/\\'
      }
    });

    // --- Cognito User Pool ---
    const userPool = new cognito.UserPool(this, 'MCPUserPool', {
      userPoolName: 'genai-mcp-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: true },
      customAttributes: {
        genai_access: new cognito.BooleanAttribute({ mutable: true })
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true }
    });

    // --- User Pool Client ---
    const userPoolClient = new cognito.UserPoolClient(this, 'MCPUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true }
    });

    // --- Shared API Keys Secret ---
    const sharedApiKeysSecret = secretsmanager.Secret.fromSecretNameV2(
      this, 'SharedApiKeysSecret', process.env.GENAI_API_KEY_SECRET || 'your-api-key-secret'
    );

    // --- Lambda IAM Role (fix IAM5) ---
    const lambdaRole = new iam.Role(this, 'MCPBridgeFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        MCPBridgePolicy: new iam.PolicyDocument({
          statements: [
            // CloudWatch Logs (scoped to this Lambda only)
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/MCPBridgeFunction:*`
              ]
            }),
            // Secrets Manager - JWT Secret
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [jwtSecret.secretArn]
            }),
            // Secrets Manager - Shared API Keys Secret
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [sharedApiKeysSecret.secretArn]
            }),
            // Cognito Admin API
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cognito-idp:AdminGetUser'],
              resources: [userPool.userPoolArn]
            }),
            // AppSync GraphQL API access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['appsync:GraphQL'],
              resources: [`arn:aws:appsync:${this.region}:${this.account}:apis/${process.env.APPSYNC_API_ID || 'your-api-id'}/*`]
            })
          ]
        })
      }
    });

    // --- Lambda Function ---
    const mcpBridgeFunction = new lambda.Function(this, 'MCPBridgeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('./lib/aws-mcp-lambda'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        JWT_SECRET_ARN: jwtSecret.secretArn,
        GENAI_GRAPHQL_URL: process.env.GENAI_GRAPHQL_URL || 'https://your-appsync-api.amazonaws.com/graphql',
        GENAI_API_KEY_SECRET: process.env.GENAI_API_KEY_SECRET || 'your-api-key-secret',
        APPSYNC_API_ID: process.env.APPSYNC_API_ID || 'your-api-id'
      }
    });

    // --- API Gateway Log Groups ---
    const webSocketLogGroup = new logs.LogGroup(this, 'MCPWebSocketApiLogGroup', {
      logGroupName: `/aws/apigateway/mcp-websocket-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const httpLogGroup = new logs.LogGroup(this, 'MCPHttpApiLogGroup', {
      logGroupName: `/aws/apigateway/mcp-http-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // --- WebSocket API ---
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'MCPWebSocketApi', {
      apiName: 'genai-mcp-bridge',
      description: 'WebSocket API for GenAI MCP Bridge'
    });

    const webSocketIntegration = new integrations.WebSocketLambdaIntegration(
      'MCPWebSocketIntegration',
      mcpBridgeFunction
    );

    const wsAuthorizer = new apigatewayv2.CfnAuthorizer(this, 'MCPWebSocketAuthorizer', {
      apiId: webSocketApi.apiId,
      name: 'CognitoAuthorizer',
      authorizerType: 'REQUEST',
      authorizerUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${mcpBridgeFunction.functionArn}/invocations`,
      identitySource: ['route.request.header.Authorization']
    });

    // WebSocket Routes (only $connect has auth)
    ['$connect', '$disconnect', '$default'].forEach(routeKey => {
      const route = webSocketApi.addRoute(routeKey, { integration: webSocketIntegration });
      if (routeKey === '$connect') {
        const cfnRoute = route.node.defaultChild as apigatewayv2.CfnRoute;
        cfnRoute.authorizerId = wsAuthorizer.ref;
        cfnRoute.authorizationType = 'CUSTOM';
      }
    });

    // Grant API Gateway permission to invoke Lambda for WebSocket authorization
    mcpBridgeFunction.addPermission('WebSocketAuthorizerInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/authorizers/${wsAuthorizer.ref}`
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'MCPWebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true
    });

    // --- HTTP API ---
    const httpApi = new apigatewayv2.HttpApi(this, 'MCPHttpApi', {
      apiName: 'genai-mcp-bridge-http',
      description: 'HTTP API for GenAI MCP Bridge',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['*']
      }
    });

    const httpAuthorizer = new apigatewayv2.CfnAuthorizer(this, 'MCPHttpApiAuthorizer', {
      apiId: httpApi.apiId,
      name: 'CognitoAuthorizer',
      authorizerType: 'JWT',
      identitySource: ['$request.header.Authorization'],
      jwtConfiguration: {
        audience: [userPoolClient.userPoolClientId],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`
      }
    });

    const httpIntegration = new integrations.HttpLambdaIntegration(
      'MCPHttpIntegration',
      mcpBridgeFunction
    );

    const httpRoute = httpApi.addRoutes({
      path: '/mcp',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: httpIntegration
    });
    const httpCfnRoute = httpRoute[0].node.defaultChild as apigatewayv2.CfnRoute;
    httpCfnRoute.authorizerId = httpAuthorizer.ref;
    httpCfnRoute.authorizationType = 'JWT';

    // --- Outputs ---
    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
      description: 'WebSocket API URL for MCP Bridge'
    });
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API URL for MCP Bridge'
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });
    new cdk.CfnOutput(this, 'JWTSecretArn', {
      value: jwtSecret.secretArn,
      description: 'JWT Secret ARN'
    });
  }
}
