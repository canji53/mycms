import { join } from 'path'
import { ServiceType } from '../../domain/model'
import { NODE_ENV } from '../../settings'

export const getPostsDirectoryName = (
  primitiveService: ServiceType
): string => {
  if (NODE_ENV === 'test') {
    return join(
      process.cwd(),
      'src',
      'infrastructure',
      'fixture',
      'contents',
      primitiveService,
      'posts'
    )
  }

  return join(process.cwd(), '..', 'contents', primitiveService, 'posts')
}

export const getPagesDirectoryName = (
  primitiveService: ServiceType
): string => {
  if (NODE_ENV === 'test') {
    return join(
      process.cwd(),
      'src',
      'infrastructure',
      'fixture',
      'contents',
      primitiveService,
      'pages'
    )
  }

  return join(process.cwd(), '..', 'contents', primitiveService, 'pages')
}
