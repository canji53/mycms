import { StackProps, Stack, App } from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib'

type GitHubOIDCProps = StackProps & {
  subject: string
}

export class GitHubOIDC extends Stack {
  public readonly principal: iam.FederatedPrincipal

  constructor(scope: App, id: string, props: GitHubOIDCProps) {
    super(scope, id, props)

    const { subject } = props

    // githubのidプロバイダはコンソール上で作成している
    // なぜ？： 単一のAWSアカウント上で、github向けのidプロバイダは一つだけしか作れないため、CDK上では管理せず、コンソールで作成・管理している。
    // もう少し詳細に： 別のサービスで同様にgithubidプロバイダを作ろうとすると、既に作られているとエラーになってしまったため、コンソールで単一のidプロバイダを作成して、そのARNを参照するようにしている。
    const openIdConnectProviderArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`

    // https://docs.github.com/ja/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#configuring-the-role-and-trust-policy
    this.principal = new iam.FederatedPrincipal(
      openIdConnectProviderArn,
      {
        StringLike: {
          'token.actions.githubusercontent.com:sub': subject,
        },
      },
      'sts:AssumeRoleWithWebIdentity'
    )
  }
}
