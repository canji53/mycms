import { Service } from '../../../../../domain/model'

describe('Service', () => {
  test('オブジェクトが生成できる', () => {
    const service = new Service({
      value: 'tolog',
    })
    expect(service).toEqual(
      expect.objectContaining({
        value: 'tolog',
      })
    )
  })
})
