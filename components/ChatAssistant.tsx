import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import Icon from './Icon';
import ChatMessageBubble from './ChatMessage';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    onSendMessage(input);
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
      <div className="p-3 border-t border-[var(--border-glow)]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
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