import { Service, Category, Tag, Slug, Post } from '../../../domain/model'

export type FindOptions = {
  category?: Category
  tag?: Tag
}

export interface PostRepository {
  find(service: Service, options?: FindOptions): Promise<Post[]>
  findOneBySlug(service: Service, slug: Slug): Promise<Post>
}
