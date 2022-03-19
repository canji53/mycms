import {
  Service,
  ServiceType,
  Category,
  Tag,
  Slug,
  Post,
} from '../../../domain/model'
import { PostRepository } from './repository'

interface PostApplicationServiceArgs {
  postRepository: PostRepository
}

export class PostApplicationService {
  private readonly postRepository: PostRepository

  constructor({ postRepository }: PostApplicationServiceArgs) {
    this.postRepository = postRepository
  }

  async fetchPosts(primitiveService: ServiceType): Promise<Post[]> {
    const service = new Service({ value: primitiveService })
    const posts = await this.postRepository.find(service)
    return posts
  }

  async fetchPostsByCategory(
    primitiveService: ServiceType,
    primitiveCategory: string
  ): Promise<Post[]> {
    const service = new Service({ value: primitiveService })
    const category = new Category({
      service,
      value: primitiveCategory,
    })
    const posts = await this.postRepository.find(service, { category })
    return posts
  }

  async fetchPostsByTag(
    primitiveService: ServiceType,
    primitiveTag: string
  ): Promise<Post[]> {
    const service = new Service({ value: primitiveService })
    const tag = new Tag({
      service,
      value: primitiveTag,
    })
    const posts = await this.postRepository.find(service, { tag })
    return posts
  }

  async fetchPost(
    primitiveService: ServiceType,
    primitiveSlug: string
  ): Promise<Post> {
    const service = new Service({ value: primitiveService })
    const slug = new Slug({
      value: primitiveSlug,
    })
    const post = await this.postRepository.findOneBySlug(service, slug)
    return post
  }
}
