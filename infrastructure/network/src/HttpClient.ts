export class HttpClient {
	get<T>(_url: string): Promise<T> {
		return Promise.resolve({} as T)
	}
	post<T>(_url: string, _body: unknown): Promise<T> {
		return Promise.resolve({} as T)
	}
}
