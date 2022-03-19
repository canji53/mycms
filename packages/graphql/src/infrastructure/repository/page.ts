import { PageRepository } from '../../application/contents'
import { PageParser } from '../markdown-parser'

export const pageRepository: PageRepository = new PageParser()
