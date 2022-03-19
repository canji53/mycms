import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

import {
  Service,
  Post,
  Slug,
  Title,
  Description,
  Category,
  Tag,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from '../../domain/model'
import { PostRepository, FindOptions } from '../../application/contents'
import { getPostsDirectoryName } from './util'

export class PostParser implements PostRepository {
  async find(service: Service, options?: FindOptions): Promise<Post[]> {
    const targetCategory = options?.category?.value
    const targetTag = options?.tag?.value

    const postsDirectory = getPostsDirectoryName(service.value)
    const slugs = fs.readdirSync(postsDirectory)

    let posts: Post[]

    posts = slugs.map((slug) => {
      const postPath = join(postsDirectory, slug, 'index.md')
      const markdown = fs.readFileSync(postPath, 'utf8')
      const { data } = matter(markdown)

      return new Post({
        service,
        slug: new Slug({ value: slug }),
        title: new Title({ value: data.title }),
        description: new Description({ value: data.description }),
        category: new Category({ service, value: data.category }),
        tags: data.tags.map((tag: string) => new Tag({ service, value: tag })),
        thumbnailUrl: new ThumbnailUrl({ value: data.thumbnailUrl }),
        createdAt: new CreatedAt({ value: new Date(data.createdAt) }),
        updatedAt: new UpdatedAt({ value: new Date(data.updatedAt) }),
      })
    })

    if (targetCategory) {
      posts = posts.filter((post) => post.category.value === targetCategory)
    }

    if (targetTag) {
      posts = posts.filter((post) =>
        post.tags.some((tag) => tag.value === targetTag)
      )
    }

    return posts.sort((previous, next) =>
      previous.createdAt.value > next.createdAt.value ? -1 : 1
    )
  }

  async findOneBySlug(service: Service, slug: Slug): Promise<Post> {
    const postsDirectory = getPostsDirectoryName(service.value)
    const postPath = join(postsDirectory, slug.value, 'index.md')
    const markdown = fs.readFileSync(postPath, 'utf8')
    const { data, content } = matter(markdown)

    return new Post({
      service,
      slug: new Slug({ value: slug.value }),
      title: new Title({ value: data.title }),
      description: new Description({ value: data.description }),
      category: new Category({ service, value: data.category }),
      tags: data.tags.map((tag: string) => new Tag({ service, value: tag })),
      thumbnailUrl: new ThumbnailUrl({ value: data.thumbnailUrl }),
      body: new Body({ value: content }),
      createdAt: new CreatedAt({ value: new Date(data.createdAt) }),
      updatedAt: new UpdatedAt({ value: new Date(data.updatedAt) }),
    })
  }
}
