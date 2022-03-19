import { StackProps, Stack, App } from 'aws-cdk-lib'
import { aws_ecr as ecr } from 'aws-cdk-lib'

type ContainerRegistryProps = StackProps & {
  repositoryName: string
  maxImageCount?: number
}

export class ContainerRegistry extends Stack {
  public readonly repository: ecr.Repository

  constructor(scope: App, id: string, props: ContainerRegistryProps) {
    super(scope, id, props)

    const { repositoryName, maxImageCount } = props

    this.repository = new ecr.Repository(this, id, {
      repositoryName,
    })

    this.repository.addLifecycleRule({
      maxImageCount: maxImageCount ?? 10,
    })
  }
}
