/**
 * value文字列がminLengthより短いか判別する関数
 * @param value 文字列
 * @param minLength 最小文字数
 * @return boolean
 */
export const isShorter = (value: string, minLength: number): boolean => {
  if (value.length < minLength) {
    return true
  }
  return false
}

/**
 * value文字列がmaxLengthより長いか判別する関数
 * @param value
 * @param maxLength
 * @return boolean
 */
export const isLonger = (value: string, maxLength: number): boolean => {
  if (value.length > maxLength) {
    return true
  }
  return false
}
