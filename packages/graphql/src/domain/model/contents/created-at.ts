type CreatedAtArgs = {
  value: Date
}

export class CreatedAt {
  readonly value!: Date

  constructor(args: CreatedAtArgs) {
    this.value = args.value
  }
}
