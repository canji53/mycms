import { Description } from '../../../../../../domain/model/contents'

const { MIN_LENGTH, MAX_LENGTH } = Description

describe('Description', () => {
  test('オブジェクトが生成できる', () => {
    const description = new Description({
      value: 'これはテスト用の概要です',
    })
    expect(description).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })

  test(`${MIN_LENGTH}より小さい場合はエラー`, () => {
    expect(() => {
      new Description({
        value: '',
      })
    }).toThrow()
  })

  test(`${MAX_LENGTH}より大きい場合はエラー`, () => {
    const value = 'a'.repeat(MAX_LENGTH + 1)
    expect(() => {
      new Description({
        value,
      })
    }).toThrow()
  })
})
