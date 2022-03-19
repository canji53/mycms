export type ServiceType = 'tolog'

export type ServiceArgs = {
  value: ServiceType
}

export class Service {
  readonly value!: ServiceType

  constructor(args: ServiceArgs) {
    this.value = args.value
  }
}
