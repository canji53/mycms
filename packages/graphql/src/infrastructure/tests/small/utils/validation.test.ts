import { isShorter, isLonger } from '../../../../utils/validation'

describe('validation', () => {
  describe('isShorter', () => {
    test('対象文字列の長さが第二引数の数字より小さければtrue', () => {
      expect(isShorter('', 1)).toBe(true)
      expect(isShorter('kods', 5)).toBe(true)
    })

    test('対象文字列の長さが第二引数の数字より大きければfalse', () => {
      expect(isShorter('ds', 1)).toBe(false)
      expect(isShorter('kodses', 5)).toBe(false)
    })
  })

  describe('isLonger', () => {
    test('対象文字列の長さが第二引数の数字より大きければtrue', () => {
      expect(isLonger('ds', 1)).toBe(true)
      expect(isLonger('kodses', 5)).toBe(true)
    })

    test('対象文字列の長さが第二引数の数字より小さければfalse', () => {
      expect(isLonger('', 1)).toBe(false)
      expect(isLonger('kods', 5)).toBe(false)
    })
  })
})
