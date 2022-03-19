import { Slug } from '../../../../../../domain/model/contents'

describe('Slug', () => {
  test('オブジェクトが生成できる', () => {
    const slug = new Slug({
      value: 'abc-_.~',
    })
    expect(slug).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })

  test('不正な文字列はエラー', () => {
    expect(() => {
      new Slug({
        value: 'ABCDZ',
      })
    })
    expect(() => {
      new Slug({
        value: '@[]+|',
      })
    })
  })
})
