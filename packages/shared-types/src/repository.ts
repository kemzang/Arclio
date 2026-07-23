import type {Result} from './result'

export interface Repository<T, ID = string> {
	findById(id: ID): Promise<Result<T | null>>
	findAll(): Promise<Result<T[]>>
	save(entity: T): Promise<Result<T>>
	delete(id: ID): Promise<Result<void>>
}
