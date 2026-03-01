/**
 * Input Validation Schemas
 * Using Zod for runtime type checking and validation
 */

import { z } from 'zod';

/**
 * Agent Schemas
 */
export const AgentInputSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID format'),
  task: z
    .string()
    .min(1, 'Task cannot be empty')
    .max(5000, 'Task is too long (max 5000 characters)'),
  context: z.record(z.unknown()).optional(),
});

export const CreateAgentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name is too long'),
  type: z.enum([
    'content_writer',
    'lead_nurture',
    'social_media',
    'analytics',
    'research',
    'code_review',
    'personal_assistant',
  ]),
  category: z.enum(['work', 'personal', 'creative', 'development']),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description is too long'),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  config: z.record(z.unknown()).optional(),
});

/**
 * Workflow Schemas
 */
export const CreateWorkflowSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['sequential', 'parallel', 'conditional', 'loop']),
  description: z.string().max(500).optional(),
  steps: z
    .array(
      z.object({
        agent_id: z.string().uuid(),
        order: z.number().int().min(0),
        config: z.record(z.unknown()).optional(),
      })
    )
    .min(1, 'At least one step is required'),
});

/**
 * File Upload Schemas
 */
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().regex(/^[\w-]+\/[\w-+.]+$/, 'Invalid file type'),
});

/**
 * Email Schemas
 */
export const EmailSchema = z.string().email('Invalid email address').max(255, 'Email is too long');

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: EmailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

/**
 * Consultation Booking Schemas
 */
export const ConsultationBookingSchema = z.object({
  client_name: z.string().min(2).max(100),
  client_email: EmailSchema,
  client_phone: z
    .string()
    .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .optional(),
  service_type: z.enum(['web_development', 'seo', 'automation', 'consulting', 'other']),
  preferred_date: z.string().datetime('Invalid date format'),
  notes: z.string().max(1000).optional(),
});

/**
 * Credential Schemas
 */
export const CredentialSchema = z.object({
  name: z.string().min(3).max(100),
  service: z.string().min(2).max(50),
  credentials: z.record(z.string()),
  is_active: z.boolean().optional().default(true),
});

/**
 * SEO Page Schemas
 */
export const SEOPageSchema = z.object({
  url: z.string().url('Invalid URL format'),
  title: z.string().min(10, 'Title too short').max(60, 'Title too long (max 60 chars)'),
  description: z
    .string()
    .min(50, 'Description too short')
    .max(160, 'Description too long (max 160 chars)'),
  keywords: z.array(z.string()).max(10, 'Too many keywords (max 10)'),
  og_image: z.string().url('Invalid image URL').optional(),
});

/**
 * Validation Helper Functions
 */

/**
 * Validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Type exports for use in components
 */
export type AgentInput = z.infer<typeof AgentInputSchema>;
export type CreateAgent = z.infer<typeof CreateAgentSchema>;
export type CreateWorkflow = z.infer<typeof CreateWorkflowSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type ContactForm = z.infer<typeof ContactFormSchema>;
export type ConsultationBooking = z.infer<typeof ConsultationBookingSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type SEOPage = z.infer<typeof SEOPageSchema>;
