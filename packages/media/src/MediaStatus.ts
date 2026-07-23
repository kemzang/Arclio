import {z} from 'zod'

export const mediaStatusSchema = z.enum(['pending', 'indexing', 'available', 'archived', 'deleted'])
export type MediaStatus = z.infer<typeof mediaStatusSchema>
export const MEDIA_STATUSES = mediaStatusSchema.options
