'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useChat } from '@/app/hooks/useChat';
import { useWorkflowStore } from '@/app/store/workflowStore';
import PropertiesPanel from './PropertiesPanel';
import { Button } from '@/app/components/ui/Button';

// ─── Playground chat ───────────────────────────────────────────────────────────
function PlaygroundChat() {
  const [inputValue, setInputValue] = useState('');
  const { messages, isStreaming, sendMessage } = useChat();
  const resetMessages = useWorkflowStore((s) => s.resetMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#282c39] shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2559f4] text-[20px]">science</span>
          <h2 className="text-slate-900 dark:text-white font-bold text-sm">Playground</h2>
        </div>
        <Button
          onClick={resetMessages}
          title="Limpiar chat"
          variant="ghost"
          size="icon"
          icon="refresh"
          className="p-1.5"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#101422]/50">
        {messages.length === 0 && (
          <>
            <div className="flex justify-center">
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-[#282c39] px-2 py-1 rounded-full">
                Sesión lista
              </span>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-[#2559f4] flex items-center justify-center shrink-0 shadow-lg shadow-[#2559f4]/20">
                <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-[10px] text-slate-400 font-medium ml-1">Atom AI</span>
                <div className="p-3 bg-white dark:bg-[#1b1e27] border border-slate-200 dark:border-[#282c39] rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-200 shadow-sm leading-relaxed">
                  ¡Hola! Soy el agente de AutoMóvil Premium. Puedo ayudarte con nuestro catálogo de vehículos, agendar una cita o resolver tus dudas. ¿En qué te puedo ayudar hoy?
                </div>
              </div>
            </div>
          </>
        )}

        {messages.map((msg, index) => {
          if (msg.role === 'user') {
            return (
              <div key={index} className="flex gap-3 flex-row-reverse">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-[#282c39] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">person</span>
                </div>
                <div className="flex flex-col gap-1 items-end max-w-[85%]">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Tú</span>
                  <div className="p-3 bg-[#2559f4] text-white rounded-2xl rounded-tr-none text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          const isLast = index === messages.length - 1;
          const isEmpty = msg.content === '';

          return (
            <div key={index} className="flex gap-3">
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${isStreaming && isLast
                  ? 'bg-[#2559f4]/50 animate-pulse'
                  : 'bg-[#2559f4] shadow-[#2559f4]/20'
                  }`}
              >
                <span className="material-symbols-outlined text-white text-[16px]">
                  {isStreaming && isLast ? 'more_horiz' : 'smart_toy'}
                </span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                {isStreaming && isLast ? (
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[10px] text-[#2559f4] font-medium">Procesando</span>
                    <span className="size-1.5 bg-[#2559f4] rounded-full animate-ping" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium ml-1">Atom AI</span>
                )}
                <div
                  className={`p-3 rounded-2xl rounded-tl-none text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${isStreaming && isLast && isEmpty
                    ? 'bg-white dark:bg-[#1b1e27] border border-[#2559f4]/30 border-dashed text-slate-500 dark:text-slate-400 italic'
                    : 'bg-white dark:bg-[#1b1e27] border border-slate-200 dark:border-[#282c39] text-slate-700 dark:text-slate-200'
                    }`}
                >
                  {isEmpty && isStreaming && isLast
                    ? 'Analizando intención y ruteando…'
                    : msg.content}
                  {isStreaming && isLast && !isEmpty && (
                    <span className="inline-block w-1.5 h-3.5 bg-[#2559f4] ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-[#1b1e27] border-t border-slate-200 dark:border-[#282c39] shrink-0">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="w-full bg-slate-50 dark:bg-[#101422] border border-slate-200 dark:border-[#282c39] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2559f4] focus:border-transparent resize-none pr-12 shadow-inner disabled:opacity-60"
            placeholder={isStreaming ? 'Esperando respuesta...' : 'Escribe un mensaje...'}
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim()}
            variant="primary"
            size="icon"
            className="absolute bottom-2 right-2 h-[34px] w-[34px] rounded-lg shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] block transform rotate-[-45deg] translate-x-px -translate-y-px">
              send
            </span>
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">
          {isStreaming ? 'Streaming response…' : 'Enter para enviar · Shift+Enter para nueva línea'}
        </p>
      </div>
    </>
  );
}

// ─── Root sidebar ──────────────────────────────────────────────────────────────
export default function SidebarRight() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const isPlaygroundVisible = useWorkflowStore((s) => s.isPlaygroundVisible);
  const setIsPlaygroundVisible = useWorkflowStore((s) => s.setIsPlaygroundVisible);
  const resetMessages = useWorkflowStore((s) => s.resetMessages);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <aside className="w-12 flex flex-col items-center py-4 border-l border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-20 shadow-xl shrink-0">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="ghost"
          size="icon"
          icon="keyboard_double_arrow_left"
          title="Expandir"
        />
      </aside>
    );
  }

  return (
    <aside className="relative w-[360px] flex flex-col border-l border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-20 shadow-xl shrink-0">
      <Button
        onClick={() => setIsExpanded(false)}
        variant="outline"
        size="icon"
        icon="keyboard_double_arrow_right"
        title="Colapsar"
        className="absolute top-4 -left-8 !w-8 !h-8 bg-white dark:bg-[#1b1e27] border-r-0 rounded-r-none rounded-l-lg shadow-sm text-slate-500 hover:text-[#2559f4] z-30"
      />

      {selectedNodeId ? (
        /* Properties panel fills the whole sidebar when a node is selected */
        <div className="flex-1 overflow-hidden flex flex-col">
          <PropertiesPanel />
        </div>
      ) : isPlaygroundVisible ? (
        /* Playground */
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <PlaygroundChat />
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-50 dark:bg-[#101422]/50">
          <div className="size-16 rounded-full bg-slate-100 dark:bg-[#282c39] flex items-center justify-center mb-4 text-slate-400">
            <span className="material-symbols-outlined text-[32px]">science</span>
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-2">Playground Inactivo</h3>
          <p className="text-sm px-4">Haz clic en <strong>Execute</strong> para iniciar una sesión de prueba.</p>
          <Button
            onClick={() => {
              resetMessages();
              setIsPlaygroundVisible(true);
            }}
            variant="success"
            icon="play_arrow"
            className="mt-6"
          >
            Execute
          </Button>
        </div>
      )}
    </aside>
  );
}
