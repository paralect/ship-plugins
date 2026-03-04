import { z } from 'zod';

import { dbSchema } from '../base.schema';

export const aiMessageRoleSchema = z.enum(['user', 'assistant']);

export const aiMessageSchema = dbSchema.extend({
  chatId: z.string().min(1, 'Chat ID is required'),
  role: aiMessageRoleSchema,
  content: z.string().min(1, 'Content is required'),
});

export type AiMessage = z.infer<typeof aiMessageSchema>;
export type AiMessageRole = z.infer<typeof aiMessageRoleSchema>;
