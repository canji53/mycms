import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

import { Service, Category } from '../../domain/model'
import { CategoryRepository } from '../../application/contents'
import { getPostsDirectoryName } from './util'

export class CategoryParser implements CategoryRepository {
  async find(service: Service): Promise<Category[]> {
    const postsDirectory = getPostsDirectoryName(service.value)
    const slugs = fs.readdirSync(postsDirectory)

    const primitiveCategories = slugs.map((slug) => {
      const postPath = join(postsDirectory, slug, 'index.md')
      const markdown = fs.readFileSync(postPath, 'utf8')
      const { data } = matter(markdown)

      return data.category as string
    })

    const unDuplicatedCategories = Array.from(new Set(primitiveCategories))

    const categories = unDuplicatedCategories.map(
      (primitiveCategory) => new Category({ service, value: primitiveCategory })
    )

    return categories
  }
}
