import { Service, ServiceType, Tag } from '../../../domain/model'
import { TagRepository } from './repository'

interface TagApplicationServiceArgs {
  tagRepository: TagRepository
}

export class TagApplicationService {
  private readonly tagRepository: TagRepository

  constructor({ tagRepository }: TagApplicationServiceArgs) {
    this.tagRepository = tagRepository
  }

  async fetchTags(primitiveService: ServiceType): Promise<Tag[]> {
    const service = new Service({ value: primitiveService })
    const tags = await this.tagRepository.find(service)
    return tags
  }
}
