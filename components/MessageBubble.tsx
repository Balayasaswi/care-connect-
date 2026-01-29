import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isAssistant = message.role === 'assistant';
  const displayDate = new Date(message.timestamp);

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm transition-all duration-300 ${
          isAssistant
            ? 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
            : 'bg-emerald-600 text-white rounded-br-none'
        }`}
      >
        <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isAssistant ? 'font-serif italic' : 'font-sans'} ${isStreaming ? 'typing-cursor' : ''}`}>
          {message.content || (isStreaming ? '' : '...')}
        </div>
        <div
          className={`text-[10px] mt-2 opacity-50 ${
            isAssistant ? 'text-slate-400' : 'text-emerald-100'
          }`}
        >
          {displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;