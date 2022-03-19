import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, parsePost } from '../utils'

export const post: GQLQueryResolvers['post'] = async (
  _: Record<string, unknown>,
  { input: { service, slug } },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const post = await context.postApplicationService.fetchPost(
    primitiveService,
    slug
  )
  return parsePost(post)
}
