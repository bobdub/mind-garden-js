import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Brain, User, Scissors, Trash2, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { SelfLearningLLM } from '@/lib/neural/SelfLearningLLM';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage } from '@/types/chat';
import { FeedbackLogger, type FeedbackKind } from '@/lib/feedback/FeedbackLogger';

interface ChatInterfaceProps {
  llm: SelfLearningLLM;
}

type RatingKind = Extract<FeedbackKind, 'thumbs_up' | 'thumbs_down'>;

type FeedbackStatus = {
  rating?: RatingKind;
  issueReported?: boolean;
};

const createMessageId = () =>
  (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

export const ChatInterface = ({ llm }: ChatInterfaceProps) => {
  const { messages, addMessage, clearMessages, trimMessages, historyWindow } = useChat();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, FeedbackStatus>>({});
  const [pendingFeedback, setPendingFeedback] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canTrimHistory = useMemo(() => messages.length > historyWindow + 1, [messages.length, historyWindow]);
  const canClearHistory = useMemo(() => messages.length > 1, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedInput,
      tags: llm.tag(trimmedInput),
      timestamp: Date.now()
    };

    const pendingHistory = [...messages, userMessage];

    addMessage(userMessage);
    setInput('');
    setIsProcessing(true);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = llm.respond(trimmedInput, pendingHistory, historyWindow);
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    };

    addMessage(assistantMessage);
    setIsProcessing(false);
  };

  const setMessagePending = (messageId: string, pending: boolean) => {
    setPendingFeedback(prev => ({
      ...prev,
      [messageId]: pending
    }));
  };

  const handleRating = async (message: ChatMessage, rating: RatingKind) => {
    const existing = feedbackStatus[message.id]?.rating;
    if (existing === rating) {
      return;
    }

    setMessagePending(message.id, true);
    try {
      await FeedbackLogger.log(message, rating, {
        metadata: { source: 'chat-interface', interaction: 'rating' }
      });
      setFeedbackStatus(prev => ({
        ...prev,
        [message.id]: {
          ...prev[message.id],
          rating
        }
      }));
    } finally {
      setMessagePending(message.id, false);
    }
  };

  const handleIssueReport = async (message: ChatMessage) => {
    if (feedbackStatus[message.id]?.issueReported) {
      return;
    }

    let comment: string | undefined;
    if (typeof window !== 'undefined') {
      const input = window.prompt('Let us know what went wrong (optional):');
      if (input === null) {
        return;
      }
      const trimmed = input.trim();
      comment = trimmed.length > 0 ? trimmed : undefined;
    }

    setMessagePending(message.id, true);
    try {
      await FeedbackLogger.log(message, 'issue', {
        comment,
        metadata: { source: 'chat-interface', interaction: 'issue-report' }
      });
      setFeedbackStatus(prev => ({
        ...prev,
        [message.id]: {
          ...prev[message.id],
          issueReported: true
        }
      }));
    } finally {
      setMessagePending(message.id, false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Neural Chat</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => trimMessages(historyWindow)}
            disabled={!canTrimHistory}
          >
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Trim to {historyWindow}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={!canClearHistory}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const status = feedbackStatus[message.id];
          const isPending = pendingFeedback[message.id];
          const rating = status?.rating;
          const issueReported = status?.issueReported;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'glass-card'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>

                {message.tags && message.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {message.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-secondary rounded-full mono text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${rating === 'thumbs_up' ? 'text-primary' : ''}`}
                        onClick={() => handleRating(message, 'thumbs_up')}
                        disabled={isPending}
                      >
                        <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                        Helpful
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${rating === 'thumbs_down' ? 'text-destructive' : ''}`}
                        onClick={() => handleRating(message, 'thumbs_down')}
                        disabled={isPending}
                      >
                        <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                        Needs work
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${issueReported ? 'text-warning' : ''}`}
                        onClick={() => handleIssueReport(message)}
                        disabled={isPending}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Report issue
                      </Button>
                    </div>
                    {(rating || issueReported) && (
                      <span className="text-[11px] text-muted-foreground">
                        {rating && !issueReported && 'Thanks for the feedback!'}
                        {rating && issueReported && 'Thanks for the feedback—issue noted.'}
                        {!rating && issueReported && 'Issue reported. We appreciate the heads-up.'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="glass-card px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="bg-input"
          />
          <Button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            size="icon"
            className="shadow-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
