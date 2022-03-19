import path from 'path'
import { readFileSync } from 'fs'
import { DocumentNode } from 'graphql'
import { ApolloServer, gql } from 'apollo-server-express'
import { buildSubgraphSchema } from '@apollo/subgraph'

import { resolvers, context } from './resolvers'
import { NODE_ENV, GRAPHQL_SCHEMA_PACKAGE } from '../../settings'

export const createApolloServer = (): ApolloServer => {
  const schemaPath = path.join(
    require.resolve(GRAPHQL_SCHEMA_PACKAGE),
    '..',
    'schema.graphql'
  )

  const typeDefs = readTypeDefs(schemaPath)

  const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    context,
    // formatError,
    debug: NODE_ENV === 'development',
  })

  return server
}

export const readTypeDefs = (schemaPath: string): DocumentNode => {
  const schemaContents: string = readFileSync(schemaPath, 'utf8')
  return gql`
    ${schemaContents}
  `
}
