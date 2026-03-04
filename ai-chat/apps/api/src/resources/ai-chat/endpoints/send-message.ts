import type { AiChat } from 'shared';
import { z } from 'zod';

import { aiChatService, aiMessageService } from 'resources/ai-chat';

import aiService from 'services/ai/ai.service';
import createEndpoint from 'routes/createEndpoint';
import shouldExist from 'routes/middlewares/shouldExist';

const schema = z.object({
  content: z.string().min(1),
});

export default createEndpoint({
  method: 'post',
  path: '/:chatId/messages',
  schema,
  middlewares: [
    shouldExist('aiChats', {
      criteria: (ctx) => ({ _id: ctx.params.chatId, userId: ctx.state.user._id }),
    }),
  ],

  async handler(ctx) {
    const { chatId } = ctx.params;
    const { content } = ctx.validatedData;

    await aiMessageService.insertOne({
      chatId,
      role: 'user',
      content,
    });

    const { results: allMessages } = await aiMessageService.find({ chatId }, {}, { sort: { createdOn: 1 } });
    const aiMessages = allMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = aiService.generateStreamingResponse(aiMessages);

    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');

    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const textEncoder = new TextEncoder();

        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            const data = JSON.stringify({ type: 'text', content: chunk });
            controller.enqueue(textEncoder.encode(`data: ${data}\n\n`));
          }

          if (!fullResponse.trim()) {
            const errorData = JSON.stringify({ type: 'error', message: 'AI returned empty response' });
            controller.enqueue(textEncoder.encode(`data: ${errorData}\n\n`));
            controller.close();
            return;
          }

          const assistantMessage = await aiMessageService.insertOne({
            chatId,
            role: 'assistant',
            content: fullResponse,
          });

          const doneData = JSON.stringify({
            type: 'done',
            messageId: assistantMessage._id,
          });
          controller.enqueue(textEncoder.encode(`data: ${doneData}\n\n`));

          const chat = ctx.state.aiChat as AiChat;
          if (!chat.title || chat.title === 'New Chat') {
            const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            await aiChatService.updateOne({ _id: chatId }, () => ({ title }));
          }

          controller.close();
        } catch (error) {
          console.error('AI streaming error:', error);
          const errorMsg = error instanceof Error ? error.message : 'AI generation failed';
          const errorData = JSON.stringify({ type: 'error', message: errorMsg });
          controller.enqueue(textEncoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    ctx.body = stream;
  },
});
