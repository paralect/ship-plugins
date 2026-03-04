import { aiChatService, aiMessageService } from 'resources/ai-chat';

import createEndpoint from 'routes/createEndpoint';
import shouldExist from 'routes/middlewares/shouldExist';

export default createEndpoint({
  method: 'delete',
  path: '/:chatId',
  middlewares: [
    shouldExist('aiChats', {
      criteria: (ctx) => ({ _id: ctx.params.chatId, userId: ctx.state.user._id }),
    }),
  ],

  async handler(ctx) {
    const { chatId } = ctx.params;

    await aiMessageService.deleteMany({ chatId });
    await aiChatService.deleteOne({ _id: chatId });

    return { success: true };
  },
});
