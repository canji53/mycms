import { Service } from '../'
import { isShorter, isLonger } from '../../../utils'

type TagArgs = {
  service: Service
  value: string
}

export class Tag {
  static readonly MIN_LENGTH = 1
  static readonly MAX_LENGTH = 30
  private readonly validRegex = new RegExp(/^[a-z0-9-_.~]+$/)

  readonly service!: Service
  readonly value!: string

  constructor(args: TagArgs) {
    this.service = args.service

    if (isShorter(args.value, Tag.MIN_LENGTH)) {
      throw new Error('Tag is too short.')
    }
    if (isLonger(args.value, Tag.MAX_LENGTH)) {
      throw new Error('Tag is too long.')
    }
    if (!this.validRegex.test(args.value)) {
      throw new Error('Invalid characters.')
    }
    this.value = args.value
  }
}
