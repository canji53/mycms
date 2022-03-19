import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, parsePost } from '../utils'

export const posts: GQLQueryResolvers['posts'] = async (
  _: Record<string, unknown>,
  { service },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const posts = await context.postApplicationService.fetchPosts(
    primitiveService
  )
  return posts.map((post) => parsePost(post))
}
