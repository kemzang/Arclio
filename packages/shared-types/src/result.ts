export type Result<T, E = Error> = Ok<T> | Err<E>

interface Ok<T> {
	ok: true
	value: T
}

interface Err<E> {
	ok: false
	error: E
}

export function ok<T, E = Error>(value: T): Result<T, E> {
	return {ok: true, value}
}

export function err<T, E = Error>(error: E): Result<T, E> {
	return {ok: false, error}
}
