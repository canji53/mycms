import { TagApplicationService } from '../../../../../application/contents'
import { tagRepository } from '../../../../repository'

describe('TagApplicationService', () => {
  describe('fetchTags', () => {
    test('複数のtagオブジェクトが取得できる', async () => {
      const tagApplicationService = new TagApplicationService({
        tagRepository,
      })
      const service = 'tolog'
      const tags = await tagApplicationService.fetchTags(service)

      const existMultipleTag = tags.length > 0
      expect(existMultipleTag).toBe(true)
    })
  })
})
