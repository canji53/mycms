import { Service, Slug, Page } from '../../../domain/model'

export interface PageRepository {
  findOneBySlug(service: Service, slug: Slug): Promise<Page>
}
