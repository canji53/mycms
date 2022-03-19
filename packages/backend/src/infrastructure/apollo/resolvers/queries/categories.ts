import { GQLQueryResolvers } from '@mycms/schema'

import { Context } from '../context'
import { fromGQLService, toGQLService } from '../utils'

export const categories: GQLQueryResolvers['categories'] = async (
  _: Record<string, unknown>,
  { service },
  context: Context
) => {
  const primitiveService = fromGQLService[service]
  const categories = await context.categoryApplicationService.fetchCategories(
    primitiveService
  )
  return categories.map((category) => ({
    service: toGQLService[category.service.value],
    title: category.value,
  }))
}
