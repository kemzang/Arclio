/** What the desktop app tells the server about itself when asking to pair. */
export interface DeviceIdentity {
	deviceName: string
	devicePlatform: string
}

/** Server response to a pairing request. `deviceCode` is secret; `userCode` is shown to the user. */
export interface PairingStart {
	userCode: string
	deviceCode: string
	expiresAt: number
	pollIntervalSeconds: number
	verificationUrl: string
}

/** Credentials handed over once a human approves the pairing. */
export interface DeviceCredentials {
	deviceToken: string
	deviceId: string
}

export type PollOutcome = {status: 'pending'} | ({status: 'approved'} & DeviceCredentials) | {status: 'expired'} | {status: 'denied'}

/** Terminal reason a wait ended without credentials. */
export type PairingFailure = 'expired' | 'denied' | 'cancelled'

export class PairingError extends Error {
	constructor(readonly reason: PairingFailure) {
		super(`Pairing ${reason}`)
		this.name = 'PairingError'
	}
}
