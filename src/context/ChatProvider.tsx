import { ReactNode, useCallback, useMemo, useReducer } from 'react';

import { ChatContext, chatReducer, INITIAL_STATE, type ChatContextValue } from '@/context/ChatContext';
import type { ChatMessage } from '@/types/chat';

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const trimMessages = useCallback((limit?: number) => {
    dispatch({ type: 'TRIM', payload: limit });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      messages: state.messages,
      historyWindow: state.historyWindow,
      addMessage,
      clearMessages,
      trimMessages
    }),
    [state.messages, state.historyWindow, addMessage, clearMessages, trimMessages]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
