import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, parsePage } from '../utils'

export const page: GQLQueryResolvers['page'] = async (
  _: Record<string, unknown>,
  { input: { service, slug } },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const page = await context.pageApplicationService.fetchPage(
    primitiveService,
    slug
  )
  return parsePage(page)
}
