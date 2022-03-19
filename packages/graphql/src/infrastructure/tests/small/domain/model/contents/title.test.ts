import { Title } from '../../../../../../domain/model/contents'

const { MIN_LENGTH, MAX_LENGTH } = Title

describe('Title', () => {
  test('オブジェクトが生成できる', () => {
    const title = new Title({
      value: 'これはテスト用のタイトルです',
    })
    expect(title).toEqual(
      expect.objectContaining({
        value: expect.any(String),
      })
    )
  })

  test(`${MIN_LENGTH}より小さい場合はエラー`, () => {
    expect(() => {
      new Title({
        value: '',
      })
    }).toThrow()
  })

  test(`${MAX_LENGTH}より大きい場合はエラー`, () => {
    const value = 'a'.repeat(MAX_LENGTH + 1)
    expect(() => {
      new Title({
        value,
      })
    }).toThrow()
  })
})
