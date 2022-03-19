import { Body } from '../../../../../../domain/model/contents'

describe('Body', () => {
  test('オブジェクトが生成できる', () => {
    const body = new Body({
      value: 'fake body.',
    })
    expect(body).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })
})
