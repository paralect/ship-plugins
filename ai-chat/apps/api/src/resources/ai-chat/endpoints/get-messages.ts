import { aiMessageService } from 'resources/ai-chat';

import createEndpoint from 'routes/createEndpoint';
import shouldExist from 'routes/middlewares/shouldExist';

export default createEndpoint({
  method: 'get',
  path: '/:chatId/messages',
  middlewares: [
    shouldExist('aiChats', {
      criteria: (ctx) => ({ _id: ctx.params.chatId, userId: ctx.state.user._id }),
    }),
  ],

  async handler(ctx) {
    const { chatId } = ctx.params;

    const { results: messages } = await aiMessageService.find({ chatId }, {}, { sort: { createdOn: 1 } });

    return messages;
  },
});
