import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, toGQLService } from '../utils'

export const tags: GQLQueryResolvers['tags'] = async (
  _: Record<string, unknown>,
  { service },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const tags = await context.tagApplicationService.fetchTags(primitiveService)
  return tags.map((tag) => ({
    service: toGQLService[tag.service.value],
    title: tag.value,
  }))
}
