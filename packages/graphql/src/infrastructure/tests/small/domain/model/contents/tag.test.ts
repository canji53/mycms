import { Service, Tag } from '../../../../../../domain/model'

const { MIN_LENGTH, MAX_LENGTH } = Tag

const service = new Service({ value: 'tolog' })

describe('Tag', () => {
  test('オブジェクトが生成できる', () => {
    const tag = new Tag({
      service,
      value: 'abc-_.~',
    })
    expect(tag).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })

  test(`${MIN_LENGTH}より小さい場合はエラー`, () => {
    expect(() => {
      new Tag({
        service,
        value: '',
      })
    }).toThrow()
  })

  test(`${MAX_LENGTH}より大きい場合はエラー`, () => {
    const value = 'a'.repeat(MAX_LENGTH + 1)
    expect(() => {
      new Tag({
        service,
        value,
      })
    }).toThrow()
  })

  test('不正な文字列はエラー', () => {
    expect(() => {
      new Tag({
        service,
        value: 'ABCDZ',
      })
    })
    expect(() => {
      new Tag({
        service,
        value: '@[]+|',
      })
    })
  })
})
