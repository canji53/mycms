import { Express } from 'express'

import { createExpressApplication } from './infrastructure/express'
import { createApolloServer } from './infrastructure/apollo'
import { launchLogger } from './infrastructure/logger'
import { LISTENING_PORT } from './settings'

let app: Express

export const start = async (): Promise<Express> => {
  if (!app) {
    app = createExpressApplication()
    launchLogger('Express Application created.')
  }

  const apolloServer = createApolloServer()
  launchLogger('Apollo Server created.')

  await apolloServer.start()
  launchLogger('Apollo Server started.')

  apolloServer.applyMiddleware({ app, path: '/graphql', cors: true })

  return app
}

start()
  .then((app) => app.listen(LISTENING_PORT))
  .then(() => {
    launchLogger(`Server listening on ${LISTENING_PORT}.`)
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
