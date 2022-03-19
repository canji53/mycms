import { PostRepository } from '../../application/contents'
import { PostParser } from '../markdown-parser'

export const postRepository: PostRepository = new PostParser()
