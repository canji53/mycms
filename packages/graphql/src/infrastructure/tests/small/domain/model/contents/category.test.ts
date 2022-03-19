import { Service, Category } from '../../../../../../domain/model'

const { MIN_LENGTH, MAX_LENGTH } = Category

const service = new Service({ value: 'tolog' })

describe('Category', () => {
  test('オブジェクトが生成できる', () => {
    const category = new Category({
      service,
      value: 'abc-_.~',
    })
    expect(category).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })

  test(`${MIN_LENGTH}より小さい場合はエラー`, () => {
    expect(() => {
      new Category({
        service,
        value: '',
      })
    }).toThrow()
  })

  test(`${MAX_LENGTH}より大きい場合はエラー`, () => {
    const value = 'a'.repeat(MAX_LENGTH + 1)
    expect(() => {
      new Category({
        service,
        value,
      })
    }).toThrow()
  })

  test('不正な文字列はエラー', () => {
    expect(() => {
      new Category({
        service,
        value: 'ABCDZ',
      })
    })
    expect(() => {
      new Category({
        service,
        value: '@[]+|',
      })
    })
  })
})
