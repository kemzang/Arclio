export class TokenService {
	getToken(): string {
		return ''
	}
	refresh(): Promise<void> {
		// noop
		return Promise.resolve()
	}
}
