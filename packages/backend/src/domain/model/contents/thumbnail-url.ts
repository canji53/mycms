type ThumbnailUrlArgs = {
  value: string
}

export class ThumbnailUrl {
  readonly value!: string

  constructor(args: ThumbnailUrlArgs) {
    this.value = args.value
  }
}
