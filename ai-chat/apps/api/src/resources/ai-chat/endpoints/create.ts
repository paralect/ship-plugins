import { z } from 'zod';

import { aiChatService } from 'resources/ai-chat';

import createEndpoint from 'routes/createEndpoint';

const schema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export default createEndpoint({
  method: 'post',
  path: '/',
  schema,

  async handler(ctx) {
    const { title } = ctx.validatedData;
    const userId = ctx.state.user._id;

    const chat = await aiChatService.insertOne({
      userId,
      title: title || 'New Chat',
    });

    return chat;
  },
});
