import { z } from 'zod';

import { aiChatService } from 'resources/ai-chat';

import createEndpoint from 'routes/createEndpoint';

const schema = z.object({});

export default createEndpoint({
  method: 'get',
  path: '/',
  schema,

  async handler(ctx) {
    const userId = ctx.state.user._id;

    const { results: chats } = await aiChatService.find({ userId }, {}, { sort: { updatedOn: -1 } });

    return chats;
  },
});
