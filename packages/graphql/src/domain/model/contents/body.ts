type BodyArgs = {
  value: string
}

export class Body {
  readonly value!: string

  constructor(args: BodyArgs) {
    this.value = args.value
  }
}
