import { Service } from '../'
import {
  Slug,
  Title,
  Description,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from './'

type PageArgs = {
  service: Service
  slug: Slug
  title: Title
  description: Description
  thumbnailUrl: ThumbnailUrl
  body: Body
  createdAt: CreatedAt
  updatedAt: UpdatedAt
}

export class Page {
  readonly service!: Service
  readonly slug!: Slug
  readonly title!: Title
  readonly description!: Description
  readonly thumbnailUrl!: ThumbnailUrl
  readonly body!: Body
  readonly createdAt!: CreatedAt
  readonly updatedAt!: UpdatedAt

  constructor(args: PageArgs) {
    this.service = args.service
    this.slug = args.slug
    this.title = args.title
    this.description = args.description
    this.thumbnailUrl = args.thumbnailUrl
    this.body = args.body
    this.createdAt = args.createdAt
    this.updatedAt = args.updatedAt
  }
}
