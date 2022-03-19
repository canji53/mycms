import { GraphQLDateTime } from 'graphql-scalars'

import { GQLQueryResolvers, GQLResolvers } from '@mycms/schema'
import {
  post,
  posts,
  postsByCategory,
  postsByTag,
  page,
  categories,
  tags,
} from './queries'

const Query: GQLQueryResolvers = {
  post,
  posts,
  postsByCategory,
  postsByTag,
  page,
  categories,
  tags,
}

export const resolvers: GQLResolvers = {
  Query,
  Date: GraphQLDateTime,
}
