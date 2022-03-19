import { UpdatedAt } from '../../../../../../domain/model/contents'

describe('UpdatedAt', () => {
  test('オブジェクトが生成できる', () => {
    const updatedAt = new UpdatedAt({
      value: new Date('2021/10/01'),
    })
    expect(updatedAt).toEqual(
      expect.objectContaining({
        value: expect.any(Date),
      })
    )
  })
})
