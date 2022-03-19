import { StackProps, Stack, App } from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib'

type IamRoleProps = StackProps & {
  roleProps: iam.RoleProps
}

export class IamRole extends Stack {
  public readonly role: iam.Role

  constructor(scope: App, id: string, props: IamRoleProps) {
    super(scope, id, props)

    const { roleProps } = props

    this.role = new iam.Role(this, id, {
      ...roleProps,
    })
  }
}
