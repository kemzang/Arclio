import {z} from 'zod'

export const mediaTypeSchema = z.enum(['video', 'audio', 'document', 'comic', 'image'])
export type MediaType = z.infer<typeof mediaTypeSchema>
export const MEDIA_TYPES = mediaTypeSchema.options
