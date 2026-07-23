export interface User {
	id: string
	email: string
	name: string
}
export interface AuthSession {
	token: string
	expiresAt: Date
	user: User
}
export interface AuthProvider {
	login(email: string, password: string): Promise<AuthSession>
	logout(): Promise<void>
}
