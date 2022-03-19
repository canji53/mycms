import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

import {
  Service,
  Page,
  Slug,
  Title,
  Description,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from '../../domain/model'
import { PageRepository } from '../../application/contents'
import { getPagesDirectoryName } from './util'

export class PageParser implements PageRepository {
  async findOneBySlug(service: Service, slug: Slug): Promise<Page> {
    const pagesDirectory = getPagesDirectoryName(service.value)
    const pagePath = join(pagesDirectory, slug.value, 'index.md')
    const markdown = fs.readFileSync(pagePath, 'utf8')
    const { data, content } = matter(markdown)

    return new Page({
      service,
      slug: new Slug({ value: slug.value }),
      title: new Title({ value: data.title }),
      description: new Description({ value: data.description }),
      thumbnailUrl: new ThumbnailUrl({ value: data.thumbnailUrl }),
      body: new Body({ value: content }),
      createdAt: new CreatedAt({ value: new Date(data.createdAt) }),
      updatedAt: new UpdatedAt({ value: new Date(data.updatedAt) }),
    })
  }
}
