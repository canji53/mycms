import { ApolloServerExpressConfig } from 'apollo-server-express'

import {
  PostApplicationService,
  PageApplicationService,
  CategoryApplicationService,
  TagApplicationService,
} from '../../../application/contents'
import {
  postRepository,
  pageRepository,
  categoryRepository,
  tagRepository,
} from '../../repository'

export interface Context {
  postApplicationService: PostApplicationService
  pageApplicationService: PageApplicationService
  categoryApplicationService: CategoryApplicationService
  tagApplicationService: TagApplicationService
}

export const context: ApolloServerExpressConfig['context'] = async ({
  res,
}): Promise<Context> => {
  // NOTE: レスポンス（リソース）のキャッシュを無効化している:
  // https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Cache-Control#preventing_caching
  res.setHeader('Cache-Control', 'no-store')

  const postApplicationService = new PostApplicationService({
    postRepository,
  })

  const pageApplicationService = new PageApplicationService({
    pageRepository,
  })

  const categoryApplicationService = new CategoryApplicationService({
    categoryRepository,
  })

  const tagApplicationService = new TagApplicationService({
    tagRepository,
  })

  const context: Context = {
    postApplicationService,
    pageApplicationService,
    categoryApplicationService,
    tagApplicationService,
  }

  return context
}
