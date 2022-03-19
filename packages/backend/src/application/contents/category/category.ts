import { Service, ServiceType, Category } from '../../../domain/model'
import { CategoryRepository } from './repository'

interface CategoryApplicationServiceArgs {
  categoryRepository: CategoryRepository
}

export class CategoryApplicationService {
  private readonly categoryRepository: CategoryRepository

  constructor({ categoryRepository }: CategoryApplicationServiceArgs) {
    this.categoryRepository = categoryRepository
  }

  async fetchCategories(primitiveService: ServiceType): Promise<Category[]> {
    const service = new Service({ value: primitiveService })
    const categories = await this.categoryRepository.find(service)
    return categories
  }
}
