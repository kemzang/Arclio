import {z} from 'zod'

export const mediaIntentSchema = z.enum(['view', 'download', 'convert', 'share'])
export type MediaIntent = z.infer<typeof mediaIntentSchema>
export const MEDIA_INTENTS = mediaIntentSchema.options
