import { App, Environment } from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib'

import { GitHubOIDC } from './lib/open-id-connect'
import { IamRole } from './lib/iam'
import { ContainerRegistry } from './lib/container-registry'
import { ContainerLambda, LambdaAlias } from './lib/lambda'
import { LambdaRestApiGateway } from './lib/api-gateway'
import { SERVICE_NAME, AWS_REGION, BACKEND_IMAGE_TAG } from './settings'

const app = new App()

const env: Environment = {
  region: AWS_REGION,
}

const { principal: githubOIDCPrincipal } = new GitHubOIDC(
  app,
  `${SERVICE_NAME}-github-oidc`,
  {
    env,
    subject: 'repo:canji53/mycms:*',
  }
)

new IamRole(app, `${SERVICE_NAME}-deploy-role`, {
  env,
  roleProps: {
    roleName: `${SERVICE_NAME}-deploy`,
    assumedBy: githubOIDCPrincipal,
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
      iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'), // 'AWSLambdaFullAccess'は非推奨になった https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/access-control-identity-based.html
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonAPIGatewayAdministrator'
      ),
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonEC2ContainerRegistryPowerUser'
      ),
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
    ],
  },
})

/**
 * for backend
 */

const backendContainerRegistry = new ContainerRegistry(
  app,
  `${SERVICE_NAME}-backend-container-registry`,
  {
    env,
    repositoryName: `${SERVICE_NAME}-backend`,
  }
)

const backendLambadRole = new IamRole(
  app,
  `${SERVICE_NAME}-backend-lambda-role`,
  {
    env,
    roleProps: {
      roleName: `${SERVICE_NAME}-backend-lambda`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    },
  }
)

const backendLambda = new ContainerLambda(
  app,
  `${SERVICE_NAME}-backend-lambda`,
  {
    env,
    functionProps: {
      functionName: `${SERVICE_NAME}-backend`,
      role: backendLambadRole.role,
    },
    containerRepository: backendContainerRegistry.repository,
    ecrImageCodeProps: {
      tag: BACKEND_IMAGE_TAG,
      workingDirectory: '/var/task/packages/backend',
      cmd: ['packages/backend/dist/lambda.backendHandler'],
      entrypoint: ['/lambda-entrypoint.sh'],
    },
  }
)

new LambdaAlias(app, `${SERVICE_NAME}-backend-lambda-blue-alias`, {
  env,
  aliasName: 'blue',
  version: backendLambda.function.latestVersion,
})

new LambdaAlias(app, `${SERVICE_NAME}-backend-lambda-v1-alias`, {
  env,
  aliasName: 'v1',
  version: backendLambda.function.latestVersion,
})

/**
 * for backend api gateway
 */

/* blue */

const blueBackendApiGateway = new LambdaRestApiGateway(
  app,
  `${SERVICE_NAME}-blue-backend-apigateway`,
  {
    env,
    restApiName: `${SERVICE_NAME}-blue-backend`,
    lambdaFunction: backendLambda.function,
    apiKeyRequired: true,
  }
)

const blueBackendStage = blueBackendApiGateway.addStage(
  `${SERVICE_NAME}-blue-backend-apigateway-stage`,
  {
    stageName: 'blue',
    lambdaFunction: backendLambda.function,
  }
)

const blueBackendUsagePlan = blueBackendApiGateway.addUsagePlan(
  `${SERVICE_NAME}-blue-backend-apigateway-usage-plan`
)

blueBackendApiGateway.addStageApiKey(
  `${SERVICE_NAME}-blue-backend-apigateway-stage-api-key`,
  {
    deploymentStage: blueBackendStage,
    usagePlan: blueBackendUsagePlan,
    apiKeyOptions: {
      apiKeyName: `${SERVICE_NAME} for blue`,
    },
  }
)

/* production */

const productionBackendApiGateway = new LambdaRestApiGateway(
  app,
  `${SERVICE_NAME}-production-backend-apigateway`,
  {
    env,
    restApiName: `${SERVICE_NAME}-production-backend`,
    lambdaFunction: backendLambda.function,
  }
)

// v1 stage (=versioning)
productionBackendApiGateway.addStage(
  `${SERVICE_NAME}-production-backend-apigateway-v1-stage`,
  {
    stageName: 'v1',
    lambdaFunction: backendLambda.function,
  }
)
