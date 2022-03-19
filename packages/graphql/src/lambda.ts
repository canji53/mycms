import { APIGatewayEvent, Callback, Context } from 'aws-lambda'
import awsServerlessExpress from '@vendia/serverless-express'
import { Express } from 'express'

import { createExpressApplication } from './infrastructure/express'
import { createApolloServer } from './infrastructure/apollo/apollo-server-express'

import { launchLogger } from './infrastructure/logger'

let app: Express

export const backendHandler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback<unknown>
): Promise<unknown> => {
  if (!app) {
    app = createExpressApplication()
    launchLogger('Express Application created.')
  }

  const apolloServer = createApolloServer()
  launchLogger('Apollo Server created.')

  await apolloServer.start()
  launchLogger('Apollo Server started.')

  apolloServer.applyMiddleware({ app, path: '/graphql', cors: true })

  const server = awsServerlessExpress({
    app,
  })

  return server(event, context, callback)
}
