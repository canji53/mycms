import { CreatedAt } from '../../../../../../domain/model/contents'

describe('CreatedAt', () => {
  test('オブジェクトが生成できる', () => {
    const createdAt = new CreatedAt({
      value: new Date('2021/10/01'),
    })
    expect(createdAt).toEqual(
      expect.objectContaining({
        value: expect.any(Date),
      })
    )
  })
})
