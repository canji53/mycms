import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, parsePost } from '../utils'

export const postsByTag: GQLQueryResolvers['postsByTag'] = async (
  _: Record<string, unknown>,
  { input: { service, tag } },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const posts = await context.postApplicationService.fetchPostsByTag(
    primitiveService,
    tag
  )
  return posts.map((post) => parsePost(post))
}
