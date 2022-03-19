import { CategoryApplicationService } from '../../../../../application/contents'
import { categoryRepository } from '../../../../repository'

describe('CategoryApplicationService', () => {
  describe('fetchCategories', () => {
    test('複数のcategoryオブジェクトが取得できる', async () => {
      const categoryApplicationService = new CategoryApplicationService({
        categoryRepository,
      })
      const service = 'tolog'
      const categories = await categoryApplicationService.fetchCategories(
        service
      )

      const existMultipleCategory = categories.length > 0
      expect(existMultipleCategory).toBe(true)
    })
  })
})
