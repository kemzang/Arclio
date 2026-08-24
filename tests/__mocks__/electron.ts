// Minimal stub of `electron` for unit tests. Only `app.isPackaged` is read by
// BinaryManager (bundledBinaryPath dev-vs-prod branch).
export const app = {isPackaged: false}

// safeStorage fake. Reversible rather than real crypto: the tests care about
// which branch AccountStore takes, not about the cipher. `available` is
// mutable so a test can exercise the "no OS keyring" refusal path.
export const safeStorage = {
	available: true,
	isEncryptionAvailable(): boolean {
		return safeStorage.available
	},
	encryptString(plain: string): Buffer {
		return Buffer.from(`enc:${plain}`, 'utf8')
	},
	decryptString(buffer: Buffer): string {
		const text = buffer.toString('utf8')
		if (!text.startsWith('enc:')) throw new Error('cannot decrypt')
		return text.slice('enc:'.length)
	}
}
