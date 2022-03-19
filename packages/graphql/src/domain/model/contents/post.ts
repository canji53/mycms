import { Service } from '../'
import {
  Slug,
  Title,
  Description,
  Category,
  Tag,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from './'

type PostArgs = {
  service: Service
  slug: Slug
  title: Title
  description: Description
  category: Category
  tags: Tag[]
  thumbnailUrl: ThumbnailUrl
  body?: Body
  createdAt: CreatedAt
  updatedAt: UpdatedAt
}

export class Post {
  readonly service!: Service
  readonly slug!: Slug
  readonly title!: Title
  readonly description!: Description
  readonly category!: Category
  readonly tags!: Tag[]
  readonly thumbnailUrl!: ThumbnailUrl
  readonly body?: Body
  readonly createdAt!: CreatedAt
  readonly updatedAt!: UpdatedAt

  constructor(args: PostArgs) {
    this.service = args.service
    this.slug = args.slug
    this.title = args.title
    this.description = args.description
    this.category = args.category
    this.tags = args.tags
    this.thumbnailUrl = args.thumbnailUrl
    if (args.body) this.body = args.body
    this.createdAt = args.createdAt
    this.updatedAt = args.updatedAt
  }
}
