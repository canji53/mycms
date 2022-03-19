import { Service, Category } from '../../../domain/model'

export interface CategoryRepository {
  find(service: Service): Promise<Category[]>
}
