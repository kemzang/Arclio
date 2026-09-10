export const RUNTIME_BINARY_INDEX_URL = 'https://github.com/kemzang-Bryan/arclio-runtime-binaries/releases/latest/download/runtime-index-v1.json'
export const RUNTIME_BINARY_INDEX_SIGNATURE_URL = 'https://github.com/kemzang-Bryan/arclio-runtime-binaries/releases/latest/download/runtime-index-v1.sig'

// Rotated 2026-09-10: the original embedded key had no matching private key
// anywhere (not in CI secrets, not on any local machine) — the signed
// remote-manifest path had never actually been operational. This is the
// first key with a real private counterpart, held only as the
// ARCLIO_RUNTIME_INDEX_SIGNING_KEY secret on the publishing workflow.
export const RUNTIME_BINARY_INDEX_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAtOtGXxUTOyPjXtc4e4R7gMirOA+fuZ8PidIGIuFTd0k=
-----END PUBLIC KEY-----
`
