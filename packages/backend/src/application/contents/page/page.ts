import { Service, ServiceType, Slug, Page } from '../../../domain/model'
import { PageRepository } from './repository'

interface PageApplicationServiceArgs {
  pageRepository: PageRepository
}

export class PageApplicationService {
  private readonly pageRepository: PageRepository

  constructor({ pageRepository }: PageApplicationServiceArgs) {
    this.pageRepository = pageRepository
  }

  async fetchPage(
    primitiveService: ServiceType,
    primitiveSlug: string
  ): Promise<Page> {
    const service = new Service({ value: primitiveService })
    const slug = new Slug({ value: primitiveSlug })
    const page = await this.pageRepository.findOneBySlug(service, slug)
    return page
  }
}
