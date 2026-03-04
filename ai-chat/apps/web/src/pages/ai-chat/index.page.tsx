import { FC, useEffect } from 'react';
import Head from 'next/head';

import { LayoutType, Page, ScopeType } from 'components';

import { AiChatBox } from './components';
import { useAiChatManager } from './hooks';

interface AiChatPageProps {
  chatId?: string;
}

const AiChatPage: FC<AiChatPageProps> = ({ chatId: initialChatId }) => {
  const { activeChatId, displayMessages, input, isLoading, isLoadingMessages, setInput, loadMessages, handleSubmit } =
    useAiChatManager({
      initialChatId,
      onChatCreated: (chatId) => {
        window.history.replaceState(null, '', `/ai-chat/${chatId}`);
      },
    });

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId, loadMessages]);

  return (
    <>
      <Head>
        <title>AI Chat</title>
      </Head>

      <div className="flex h-full">
        <div className="flex-1">
          <AiChatBox
            messages={displayMessages.map((m) => ({ id: m._id, role: m.role, content: m.content }))}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isLoadingMessages={isLoadingMessages && !!initialChatId}
          />
        </div>
      </div>
    </>
  );
};

export { AiChatPage };

const AiChatIndexPage = () => (
  <Page scope={ScopeType.PRIVATE} layout={LayoutType.MAIN}>
    <AiChatPage />
  </Page>
);

export default AiChatIndexPage;
