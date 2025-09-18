import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import Icon from './Icon';
import ChatMessageBubble from './ChatMessage';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  suggestedActions: string[];
}

const SuggestedAction: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button onClick={onClick} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white transition-all duration-200 border border-transparent hover:border-[var(--accent-cyan)]/50 transform hover:-translate-y-0.5">
        {text}
    </button>
);

const ChatAssistant: React.FC<ChatAssistantProps> = ({ messages, onSendMessage, isProcessing, suggestedActions }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (message: string) => {
    if (!message.trim() || isProcessing) return;
    onSendMessage(message);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full rounded-2xl">
      <div className="p-4 border-b border-[var(--border-glow)] flex items-center gap-3">
        <Icon name="sparkles" className="w-6 h-6 text-[var(--accent-cyan)]" />
        <h2 className="text-xl font-bold">Email Agent</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto futuristic-scrollbar">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <ChatMessageBubble key={index} message={msg} />
          ))}
          {isProcessing && (
             <ChatMessageBubble message={{ author: MessageAuthor.AI, text: "Thinking..." }} isThinking={true} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {suggestedActions.length > 0 && (
        <div className="p-3 border-t border-[var(--border-glow)]">
            <div className="flex flex-wrap gap-2">
                {suggestedActions.map((action, index) => (
                    <SuggestedAction key={index} text={action} onClick={() => handleSend(action)} />
                ))}
            </div>
        </div>
      )}
      <div className="p-3 border-t border-[var(--border-glow)]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Summarize unread emails'"
            className="w-full bg-black/20 text-white placeholder-slate-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            <Icon name="paper-airplane" className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;