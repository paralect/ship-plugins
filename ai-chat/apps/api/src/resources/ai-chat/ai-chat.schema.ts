import { z } from 'zod';

import { dbSchema } from '../base.schema';

export const aiChatSchema = dbSchema.extend({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1).max(255).default('New Chat'),
});

export type AiChat = z.infer<typeof aiChatSchema>;
