import { Service, Tag } from '../../../domain/model'

export interface TagRepository {
  find(service: Service): Promise<Tag[]>
}
