import React from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import Icon from './Icon';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isThinking?: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isThinking = false }) => {
  const isUser = message.author === MessageAuthor.USER;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0 flex items-center justify-center">
            <Icon name="sparkles" className="w-5 h-5 text-white"/>
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-sm rounded-xl px-4 py-2 animate-slow-fade-in
          ${ isUser
            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none'
            : 'bg-slate-700/80 text-slate-200 rounded-bl-none'
        }`}
      >
        {isThinking ? (
             <div className="flex items-center space-x-2 py-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
        ) : (
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        )}
      </div>
      {isUser && (
         <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center">
            <Icon name="user" className="w-5 h-5 text-white"/>
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;
