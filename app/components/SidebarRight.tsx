'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useChat } from '@/app/hooks/useChat';
import { useWorkflowStore } from '@/app/store/workflowStore';

export default function SidebarRight() {
  const [inputValue, setInputValue] = useState('');
  const { messages, isStreaming, sendMessage } = useChat();
  const resetMessages = useWorkflowStore((s) => s.resetMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isStreaming) return;
    setInputValue('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="w-[360px] flex flex-col border-l border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-20 shadow-xl shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#282c39]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2559f4] text-[20px]">science</span>
          <h2 className="text-slate-900 dark:text-white font-bold text-sm">Playground</h2>
        </div>
        <button
          onClick={resetMessages}
          title="Clear chat"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#282c39] rounded text-slate-500 hover:text-[#2559f4] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#101422]/50">
        {/* Welcome message shown before any conversation */}
        {messages.length === 0 && (
          <>
            <div className="flex justify-center">
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-[#282c39] px-2 py-1 rounded-full">
                Session ready
              </span>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-[#2559f4] flex items-center justify-center shrink-0 shadow-lg shadow-[#2559f4]/20">
                <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-[10px] text-slate-400 font-medium ml-1">Atom AI</span>
                <div className="p-3 bg-white dark:bg-[#1b1e27] border border-slate-200 dark:border-[#282c39] rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-200 shadow-sm leading-relaxed">
                  Hello! I&apos;m ready to test your workflow. How can I assist you today?
                </div>
              </div>
            </div>
          </>
        )}

        {/* Render messages from the store */}
        {messages.map((msg, index) => {
          if (msg.role === 'user') {
            return (
              <div key={index} className="flex gap-3 flex-row-reverse">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-[#282c39] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">person</span>
                </div>
                <div className="flex flex-col gap-1 items-end max-w-[85%]">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">You</span>
                  <div className="p-3 bg-[#2559f4] text-white rounded-2xl rounded-tr-none text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          // Assistant message
          const isLastMessage = index === messages.length - 1;
          const isEmpty = msg.content === '';

          return (
            <div key={index} className="flex gap-3">
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  isStreaming && isLastMessage
                    ? 'bg-[#2559f4]/50 animate-pulse'
                    : 'bg-[#2559f4] shadow-[#2559f4]/20'
                }`}
              >
                <span className="material-symbols-outlined text-white text-[16px]">
                  {isStreaming && isLastMessage ? 'more_horiz' : 'smart_toy'}
                </span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                {isStreaming && isLastMessage ? (
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[10px] text-[#2559f4] font-medium">Processing</span>
                    <span className="size-1.5 bg-[#2559f4] rounded-full animate-ping" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium ml-1">Atom AI</span>
                )}
                <div
                  className={`p-3 rounded-2xl rounded-tl-none text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                    isStreaming && isLastMessage && isEmpty
                      ? 'bg-white dark:bg-[#1b1e27] border border-[#2559f4]/30 border-dashed text-slate-500 dark:text-slate-400 italic'
                      : 'bg-white dark:bg-[#1b1e27] border border-slate-200 dark:border-[#282c39] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isEmpty && isStreaming && isLastMessage
                    ? 'Analyzing intent and routing...'
                    : msg.content}
                  {/* Blinking cursor while streaming this message */}
                  {isStreaming && isLastMessage && !isEmpty && (
                    <span className="inline-block w-1.5 h-3.5 bg-[#2559f4] ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white dark:bg-[#1b1e27] border-t border-slate-200 dark:border-[#282c39]">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="w-full bg-slate-50 dark:bg-[#101422] border border-slate-200 dark:border-[#282c39] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2559f4] focus:border-transparent resize-none pr-12 shadow-inner disabled:opacity-60"
            placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim()}
            className="absolute bottom-2 right-2 p-2 bg-[#2559f4] hover:bg-[#2559f4]/90 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] block transform rotate-[-45deg] translate-x-px -translate-y-px">
              send
            </span>
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-1">
          <div className="text-[10px] text-slate-400 font-medium">
            {isStreaming
              ? 'Streaming response...'
              : 'Enter to send · Shift+Enter for newline'}
          </div>
        </div>
      </div>

      {/* Debug Panel (collapsible placeholder) */}
      <div className="border-t border-slate-200 dark:border-[#282c39] bg-slate-50 dark:bg-[#101422]/30">
        <button className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-500 hover:text-[#2559f4] hover:bg-slate-100 dark:hover:bg-[#282c39] transition-colors">
          <span>Debug Console</span>
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
      </div>
    </aside>
  );
}
