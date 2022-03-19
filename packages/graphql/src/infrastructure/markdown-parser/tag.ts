import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

import { Service, Tag } from '../../domain/model'
import { TagRepository } from '../../application/contents'
import { getPostsDirectoryName } from './util'

export class TagParser implements TagRepository {
  async find(service: Service): Promise<Tag[]> {
    const postsDirectory = getPostsDirectoryName(service.value)
    const slugs = fs.readdirSync(postsDirectory)

    const primitiveTags = slugs.map((slug) => {
      const postPath = join(postsDirectory, slug, 'index.md')
      const markdown = fs.readFileSync(postPath, 'utf8')
      const { data } = matter(markdown)

      return data.tags as string[]
    })

    const flattenTags = primitiveTags.flat()

    const unDuplicatedTags = Array.from(new Set(flattenTags))

    const tags = unDuplicatedTags.map(
      (primitiveTag) => new Tag({ service, value: primitiveTag })
    )

    return tags
  }
}
