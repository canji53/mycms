import { ThumbnailUrl } from '../../../../../../domain/model/contents'

describe('ThumbnailUrl', () => {
  test('オブジェクトが生成できる', () => {
    const socialLink = new ThumbnailUrl({
      value: 'https://github.com/example-example.png',
    })
    expect(socialLink).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })
})
