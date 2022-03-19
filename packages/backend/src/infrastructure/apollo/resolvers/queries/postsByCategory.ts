import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, parsePost } from '../utils'

export const postsByCategory: GQLQueryResolvers['postsByCategory'] = async (
  _: Record<string, unknown>,
  { input: { service, category } },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const posts = await context.postApplicationService.fetchPostsByCategory(
    primitiveService,
    category
  )
  return posts.map((post) => parsePost(post))
}
