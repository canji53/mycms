import express, { Express, Router } from 'express'

export const createExpressApplication = (): Express => {
  const app = express()

  // NOTE: x-powerd-byはexpressのバージョン情報が含まれ、headを解析されるとセキュリティ的にまずい
  app.disable('x-powerd-by')

  const router = setRouter()
  app.use(router)

  return app
}

export const setRouter = (): Router => {
  const router = express.Router()

  router.get('/health', (_, res) => {
    res.send('OK')
  })

  return router
}
