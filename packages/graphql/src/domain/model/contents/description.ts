import { isShorter, isLonger } from '../../../utils'

type DescriptionArgs = {
  value: string
}

export class Description {
  static readonly MIN_LENGTH = 1
  static readonly MAX_LENGTH = 400

  readonly value!: string

  constructor(args: DescriptionArgs) {
    if (isShorter(args.value, Description.MIN_LENGTH)) {
      throw new Error('Description is too short.')
    }
    if (isLonger(args.value, Description.MAX_LENGTH)) {
      throw new Error('Description is too long.')
    }
    this.value = args.value
  }
}
