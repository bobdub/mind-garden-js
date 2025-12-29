import { createContext, useContext } from 'react';
import type { ChatMessage } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  historyWindow: number;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR' }
  | { type: 'TRIM'; payload?: number };

export interface ChatContextValue {
  messages: ChatMessage[];
  historyWindow: number;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  trimMessages: (limit?: number) => void;
}

const createAssistantMessage = (content: string): ChatMessage => ({
  id:
    typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'assistant',
  content,
  timestamp: Date.now()
});

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = createAssistantMessage(
  "Hello! I'm a self-learning LLM. I'll learn from our conversations. Try teaching me something!"
);

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
        messages: [createAssistantMessage(INITIAL_ASSISTANT_MESSAGE.content)]
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

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export { ChatContext, chatReducer, INITIAL_STATE };
