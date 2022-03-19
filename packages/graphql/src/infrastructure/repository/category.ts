import { CategoryRepository } from '../../application/contents'
import { CategoryParser } from '../markdown-parser'

export const categoryRepository: CategoryRepository = new CategoryParser()
