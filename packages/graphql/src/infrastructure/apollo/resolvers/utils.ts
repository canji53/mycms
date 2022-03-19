import { GQLService } from '@mycms/schema'
import { ServiceType, Post, Page } from '../../../domain/model'

export const fromGQLService: Record<GQLService, ServiceType> = {
  [GQLService.Tolog]: 'tolog',
}

export const toGQLService: Record<ServiceType, GQLService> = {
  tolog: GQLService.Tolog,
}

export const parsePost = (post: Post) => {
  return {
    service: toGQLService[post.service.value],
    slug: post.slug.value,
    title: post.title.value,
    description: post.description.value,
    category: post.category?.value,
    tags: post.tags?.map((tag) => tag.value),
    thumbnailUrl: post.thumbnailUrl?.value,
    body: post.body?.value,
    createdAt: post.createdAt.value,
    updatedAt: post.updatedAt.value,
  }
}

export const parsePage = (page: Page) => {
  return {
    service: toGQLService[page.service.value],
    slug: page.slug.value,
    title: page.title.value,
    description: page.description.value,
    thumbnailUrl: page.thumbnailUrl.value,
    body: page.body.value,
    createdAt: page.createdAt.value,
    updatedAt: page.updatedAt.value,
  }
}
