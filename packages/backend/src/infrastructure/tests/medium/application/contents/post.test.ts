import { PostApplicationService } from '../../../../../application/contents'
import { postRepository } from '../../../../repository'

describe('PostApplicationService', () => {
  describe('fetchPosts', () => {
    test('複数のpostオブジェクトが取得できる', async () => {
      const postApplicationService = new PostApplicationService({
        postRepository,
      })
      const service = 'tolog'
      const posts = await postApplicationService.fetchPosts(service)

      const existMultiplePost = posts.length > 0
      expect(existMultiplePost).toBe(true)
    })
  })

  describe('fetchPostsByCategory', () => {
    test('指定カテゴリの複数のpostオブジェクトが取得できる', async () => {
      const postApplicationService = new PostApplicationService({
        postRepository,
      })
      const service = 'tolog'
      const category = 'aws'
      const posts = await postApplicationService.fetchPostsByCategory(
        service,
        category
      )

      const hasSameCategory = posts.every(
        (post) => post.category.value === category
      )
      expect(hasSameCategory).toBe(true)
    })
  })

  describe('fetchPostsByTag', () => {
    test('指定タグの複数のpostオブジェクトが取得できる', async () => {
      const postApplicationService = new PostApplicationService({
        postRepository,
      })
      const service = 'tolog'
      const _tag = 'awscli'
      const posts = await postApplicationService.fetchPostsByTag(service, _tag)

      const hasSameTag = posts.every((post) =>
        post.tags.some((tag) => tag.value === _tag)
      )
      expect(hasSameTag).toBe(true)
    })
  })

  describe('fetchPost', () => {
    test('指定のpostオブジェクトが取得できる', async () => {
      const postApplicationService = new PostApplicationService({
        postRepository,
      })
      const service = 'tolog'
      const slug = 'wordpress-dockerfile'
      const post = await postApplicationService.fetchPost(service, slug)
      expect(post).not.toBeUndefined()
    })
  })
})
