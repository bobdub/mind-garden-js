import { createContext, useCallback, useContext, useMemo, useReducer, ReactNode } from 'react';
import type { ChatMessage } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  historyWindow: number;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR' }
  | { type: 'TRIM'; payload?: number };

interface ChatContextValue {
  messages: ChatMessage[];
  historyWindow: number;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  trimMessages: (limit?: number) => void;
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hello! I'm a self-learning LLM. I'll learn from our conversations. Try teaching me something!",
  timestamp: Date.now()
};

const INITIAL_STATE: ChatState = {
  messages: [INITIAL_ASSISTANT_MESSAGE],
  historyWindow: 8
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'CLEAR':
      return {
        ...state,
        messages: [
          {
            ...INITIAL_ASSISTANT_MESSAGE,
            timestamp: Date.now()
          }
        ]
      };
    case 'TRIM': {
      const limit = action.payload ?? state.historyWindow;
      if (limit <= 0) {
        return {
          ...state,
          messages: state.messages.slice(0, 1)
        };
      }

      const [initial, ...rest] = state.messages;
      if (!initial) {
        return state;
      }

      if (rest.length <= limit) {
        return state;
      }

      const trimmed = rest.slice(-limit);
      return {
        ...state,
        messages: [initial, ...trimmed]
      };
    }
    default:
      return state;
  }
}

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

  const value = useMemo<ChatContextValue>(() => ({
    messages: state.messages,
    historyWindow: state.historyWindow,
    addMessage,
    clearMessages,
    trimMessages
  }), [state.messages, state.historyWindow, addMessage, clearMessages, trimMessages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
