import { TagRepository } from '../../application/contents'
import { TagParser } from '../markdown-parser'

export const tagRepository: TagRepository = new TagParser()
