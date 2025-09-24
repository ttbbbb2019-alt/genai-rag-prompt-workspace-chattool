import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AwsGenAILLMChatbotStack } from "../../lib/aws-genai-llm-chatbot-stack";
import { getTestConfig } from "../utils/config-util";

describe("Infrastructure Integration Tests", () => {
  let app: App;
  let stack: AwsGenAILLMChatbotStack;
  let template: Template;

  beforeAll(() => {
    app = new App();
    const config = getTestConfig();
    stack = new AwsGenAILLMChatbotStack(app, "TestStack", {
      config,
      env: { region: "us-east-1", account: "123456789" }
    });
    template = Template.fromStack(stack);
  });

  test("should create required Lambda functions", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "python3.11"
    });
  });

  test("should create Cognito user pool", () => {
    template.hasResourceProperties("AWS::Cognito::UserPool", {
      UserPoolName: expect.stringContaining("UserPool")
    });
  });

  test("should create DynamoDB tables", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      BillingMode: "PAY_PER_REQUEST"
    });
  });

  test("should create CloudFront distribution", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: expect.objectContaining({
        Enabled: true
      })
    });
  });

  test("should create AppSync GraphQL API", () => {
    template.hasResourceProperties("AWS::AppSync::GraphQLApi", {
      AuthenticationType: "AMAZON_COGNITO_USER_POOLS"
    });
  });
});
