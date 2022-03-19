import {
  Service,
  Post,
  Slug,
  Title,
  Description,
  Category,
  Tag,
  ThumbnailUrl,
  Body,
  CreatedAt,
  UpdatedAt,
} from '../../../../../../domain/model'

const service = new Service({ value: 'tolog' })

describe('Post', () => {
  test('オブジェクトが生成できる', () => {
    expect(() => {
      new Post({
        service,
        slug: new Slug({ value: 'test' }),
        title: new Title({ value: 'テスト' }),
        description: new Description({ value: 'テスト用の概要です' }),
        category: new Category({ service, value: 'test' }),
        tags: [
          new Tag({ service, value: 'test1' }),
          new Tag({ service, value: 'test2' }),
        ],
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
