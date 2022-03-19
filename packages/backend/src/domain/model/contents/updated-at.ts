type UpdatedAtArgs = {
  value: Date
}

export class UpdatedAt {
  readonly value!: Date

  constructor(args: UpdatedAtArgs) {
    this.value = args.value
  }
}
