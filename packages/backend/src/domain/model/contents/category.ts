import { Service } from '../'
import { isShorter, isLonger } from '../../../utils'

type CategoryArgs = {
  service: Service
  value: string
}

export class Category {
  static readonly MIN_LENGTH = 1
  static readonly MAX_LENGTH = 30
  private readonly validRegex = new RegExp(/^[a-z0-9-_.~]+$/)

  readonly service!: Service
  readonly value!: string

  constructor(args: CategoryArgs) {
    this.service = args.service

    if (isShorter(args.value, Category.MIN_LENGTH)) {
      throw new Error('Category is too short.')
    }
    if (isLonger(args.value, Category.MAX_LENGTH)) {
      throw new Error('Category is too long.')
    }
    if (!this.validRegex.test(args.value)) {
      throw new Error('Invalid characters.')
    }
    this.value = args.value
  }
}
