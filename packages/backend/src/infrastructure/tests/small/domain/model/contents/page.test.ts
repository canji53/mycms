import {
  Service,
  Page,
  Slug,
  Title,
  Description,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from '../../../../../../domain/model'

const service = new Service({ value: 'tolog' })

describe('Page', () => {
  test('オブジェクトが生成できる', () => {
    expect(() => {
      new Page({
        service,
        slug: new Slug({ value: 'test' }),
        title: new Title({ value: 'テスト' }),
        description: new Description({ value: 'テスト用の概要です' }),
        thumbnailUrl: new ThumbnailUrl({
          value: 'https://github.com/example-example.png',
        }),
        body: new Body({ value: 'テスト用のBody' }),
        createdAt: new CreatedAt({ value: new Date() }),
        updatedAt: new UpdatedAt({ value: new Date() }),
      })
    }).not.toThrow()
  })
})
