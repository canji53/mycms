import { StackProps, Stack, App } from 'aws-cdk-lib'
import { aws_apigateway as apigateway, aws_lambda as lambda } from 'aws-cdk-lib'

type LambdaRestApiGatewayProps = StackProps & {
  restApiName: string
  lambdaFunction: lambda.Function
  apiKeyRequired?: boolean
}

type AddStageProps = {
  stageName: string
  lambdaFunction: lambda.IFunction
  variables?: { [key: string]: string }
}

type AssociateUsagePlanToStageProps = {
  usagePlan: apigateway.UsagePlan
  deploymentStage: apigateway.Stage
}

type AddStageApiKeyProps = {
  deploymentStage: apigateway.Stage
  usagePlan: apigateway.UsagePlan
  apiKeyOptions?: apigateway.ApiKeyOptions
}

export class LambdaRestApiGateway extends Stack {
  readonly restApi: apigateway.RestApi
  readonly deployment: apigateway.Deployment

  constructor(scope: App, id: string, props: LambdaRestApiGatewayProps) {
    super(scope, id, props)

    const { restApiName, lambdaFunction, apiKeyRequired } = props

    const lambdaAlias = lambda.Function.fromFunctionArn(
      this,
      `${id}-lambda-stage`,
      `${lambdaFunction.functionArn}:\${stageVariables.alias}`
    )

    // https://github.com/aws/aws-cdk/issues/6143#issuecomment-796408877
    const defaultIntegration = new apigateway.AwsIntegration({
      proxy: true,
      service: 'lambda',
      path: `2015-03-31/functions/${lambdaAlias.functionArn}/invocations`,
    })

    const defaultCorsPreflightOptions = {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    }

    this.restApi = new apigateway.RestApi(this, id, {
      restApiName,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultIntegration, // 指定しない場合、MOCK統合になってしまうため
      defaultCorsPreflightOptions,
      deploy: false, // 基本設計として、prodステージ、deploymentを作らないようにする
    })

    this.restApi.root.addMethod('ANY', defaultIntegration, {
      apiKeyRequired,
    })

    this.restApi.root
      .addResource('{proxy+}')
      .addMethod('ANY', defaultIntegration, {
        apiKeyRequired,
      })

    this.deployment = new apigateway.Deployment(this, `${id}-deployment`, {
      api: this.restApi,
      retainDeployments: true,
    })
  }

  addStage(id: string, props: AddStageProps): apigateway.Stage {
    const { stageName, lambdaFunction, variables } = props

    const stage = new apigateway.Stage(this, id, {
      deployment: this.deployment,
      stageName,
      variables: {
        ...variables,
        alias: stageName,
      },
    })

    /**
     * 追加stageがlambdaをinvokeできるように権限を追加
     */
    new lambda.CfnPermission(this, `${id}-invoke-root-function`, {
      action: 'lambda:InvokeFunction',
      functionName: `${lambdaFunction.functionName}:${stageName}`,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.restApi.restApiId}/${stageName}/*/`,
    })

    new lambda.CfnPermission(this, `${id}-invoke-proxy-function`, {
      action: 'lambda:InvokeFunction',
      functionName: `${lambdaFunction.functionName}:${stageName}`,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.restApi.restApiId}/${stageName}/*/*`,
    })

    return stage
  }

  addUsagePlan(
    id: string,
    usagePlanProps?: apigateway.UsagePlanProps
  ): apigateway.UsagePlan {
    return this.restApi.addUsagePlan(id, usagePlanProps)
  }

  private associateUsagePlanToStage(
    props: AssociateUsagePlanToStageProps
  ): void {
    const { usagePlan, deploymentStage } = props

    usagePlan.addApiStage({
      stage: deploymentStage,
    })
  }

  addStageApiKey(id: string, props: AddStageApiKeyProps): void {
    const { deploymentStage, usagePlan, apiKeyOptions } = props

    this.associateUsagePlanToStage({ usagePlan, deploymentStage })

    /**
     * NOTE: deploymentStageを差し込んでいる件についての説明
     *
     * この api gateway のスタックの基本方針として、
     * デフォルトの prod ステージは生成されないように、deploy オプションを false 扱いにしている。
     *
     * これは、次のことを目的としている。
     * (1) prod ステージが勝手に作られないようにすることで、見当のつきやすい URL を未然に防ぐ
     * (2)柔軟にステージを作ることを前提としたデプロイ戦力のため、戦略街の prod ステージは邪魔になる
     *
     *　ただし、そのために restApi　の deploymentStage が空の状態になってしまう!!
     * （deploy オプションが true になっていれば、prod ステージ向けの deploymentStage が入ることになる）
     * そうなると、addApiKey メソッドで stageName が undefined で生成できないとエラーになる。
     * addApiKey で stageName　を差し込むプロパティもないため、ここで詰みになってしまう。
     *
     * これを回避するため、以下では、わざわざ特定の deploymentStage を挿し込むようにしている。
     */
    this.restApi.deploymentStage = deploymentStage

    const apiKey = this.restApi.addApiKey(id, apiKeyOptions)

    // FIXME: 意図しない deploymentStage が、操作されないように敢えて削除している。
    // 必須プロパティなので as して無理やり空のオブジェクトを渡している。
    this.restApi.deploymentStage = {} as apigateway.Stage

    usagePlan.addApiKey(apiKey)
  }
}
