import { z } from 'zod';
export const createContactSchema = z.object({
    body: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        status: z.enum(['active', 'inactive', 'prospect']).default('active'),
        source: z.enum(['website', 'referral', 'email', 'social', 'cold_call']).default('website'),
    }),
});
export const updateContactSchema = z.object({
    body: createContactSchema.shape.body.partial(),
    params: z.object({
        id: z.string().uuid('Invalid contact ID'),
    }),
});
export const getContactByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid contact ID'),
    }),
});
