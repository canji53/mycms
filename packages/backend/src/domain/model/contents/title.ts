import { isShorter, isLonger } from '../../../utils'

type TitleArgs = {
  value: string
}

export class Title {
  static readonly MIN_LENGTH = 1
  static readonly MAX_LENGTH = 100

  readonly value!: string

  constructor(args: TitleArgs) {
    if (isShorter(args.value, Title.MIN_LENGTH)) {
      throw new Error('Title is too short.')
    }
    if (isLonger(args.value, Title.MAX_LENGTH)) {
      throw new Error('Title is too long.')
    }
    this.value = args.value
  }
}
