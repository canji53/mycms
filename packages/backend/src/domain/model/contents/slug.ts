type SlugArgs = {
  value: string
}

export class Slug {
  private readonly validRegex = new RegExp(/^[a-z0-9-_.~]+$/)

  readonly value!: string

  constructor(args: SlugArgs) {
    if (!this.validRegex.test(args.value)) {
      throw new Error('Invalid characters.')
    }
    this.value = args.value
  }
}
