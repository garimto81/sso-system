/**
 * App Form Validation Schemas
 * Zod schemas for app creation and update
 */

import { z } from 'zod'

/**
 * URL validation helper
 */
const urlSchema = z.string().url('Must be a valid URL')

/**
 * Create App Schema
 */
export const createAppSchema = z.object({
  name: z
    .string()
    .min(1, 'App name is required')
    .min(3, 'App name must be at least 3 characters')
    .max(100, 'App name must be less than 100 characters'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  redirect_urls: z
    .array(urlSchema)
    .min(1, 'At least one redirect URL is required')
    .max(10, 'Maximum 10 redirect URLs allowed'),

  allowed_origins: z
    .array(urlSchema)
    .min(1, 'At least one allowed origin is required')
    .max(10, 'Maximum 10 allowed origins allowed'),
})

export type CreateAppFormData = z.infer<typeof createAppSchema>

/**
 * Update App Schema
 */
export const updateAppSchema = z.object({
  name: z
    .string()
    .min(3, 'App name must be at least 3 characters')
    .max(100, 'App name must be less than 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  redirect_urls: z
    .array(urlSchema)
    .min(1, 'At least one redirect URL is required')
    .max(10, 'Maximum 10 redirect URLs allowed')
    .optional(),

  allowed_origins: z
    .array(urlSchema)
    .min(1, 'At least one allowed origin is required')
    .max(10, 'Maximum 10 allowed origins allowed')
    .optional(),

  is_active: z.boolean().optional(),
})

export type UpdateAppFormData = z.infer<typeof updateAppSchema>

/**
 * URL Array Input Schema (for dynamic fields)
 */
export const urlArraySchema = z.object({
  url: z.string().url('Must be a valid URL'),
})

export type UrlArrayItem = z.infer<typeof urlArraySchema>
