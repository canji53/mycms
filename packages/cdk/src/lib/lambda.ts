import { StackProps, Stack, App, Duration } from 'aws-cdk-lib'
import { aws_lambda as lambda, aws_ecr as ecr } from 'aws-cdk-lib'

type ContainerLambdaProps = StackProps & {
  functionProps: Omit<
    lambda.FunctionProps,
    'code' | 'runtime' | 'handler' | 'environment'
  >
  containerRepository: ecr.IRepository
  ecrImageCodeProps: lambda.EcrImageCodeProps
  environment?: { [key: string]: string }
}

export class ContainerLambda extends Stack {
  public readonly function: lambda.Function

  constructor(scope: App, id: string, props: ContainerLambdaProps) {
    super(scope, id, props)

    const {
      functionProps,
      containerRepository,
      ecrImageCodeProps,
      environment = {},
    } = props

    const functionCommonProps = {
      memorySize: 128,
      timeout: Duration.seconds(30),
    }

    const commonEnvironment = {
      NODE_ENV: 'production',
      DEBUG: '*',
    }

    this.function = new lambda.Function(this, id, {
      code: lambda.Code.fromEcrImage(containerRepository, ecrImageCodeProps),
      handler: lambda.Handler.FROM_IMAGE,
      runtime: lambda.Runtime.FROM_IMAGE,
      ...functionCommonProps,
      ...functionProps,
      environment: {
        ...commonEnvironment,
        ...environment,
      },
    })

    if (!this.function.role) {
      throw new Error(`lambda role must exist: ${this.function.functionName}`)
    }
  }
}

type LambdaAliasProps = StackProps & {
  aliasName: string
  version: lambda.IVersion
}

export class LambdaAlias extends Stack {
  constructor(scope: App, id: string, props: LambdaAliasProps) {
    super(scope, id, props)

    const { aliasName, version } = props

    new lambda.Alias(this, id, {
      aliasName,
      version,
    })
  }
}
