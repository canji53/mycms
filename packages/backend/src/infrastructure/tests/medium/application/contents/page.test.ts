import { PageApplicationService } from '../../../../../application/contents'
import { pageRepository } from '../../../../repository'

describe('PageApplicationService', () => {
  describe('fetchPage', () => {
    test('指定のpageオブジェクトが取得できる', async () => {
      const pageApplicationService = new PageApplicationService({
        pageRepository,
      })
      const service = 'tolog'
      const slug = 'about'
      const page = await pageApplicationService.fetchPage(service, slug)
      expect(page).not.toBeUndefined()
    })
  })
})
