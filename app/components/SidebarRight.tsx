'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useChat } from '@/app/hooks/useChat';
import { useWorkflowStore } from '@/app/store/workflowStore';
import PropertiesPanel from './PropertiesPanel';

// ─── Debug console ─────────────────────────────────────────────────────────────
function DebugConsole() {
  const pipelineState = useWorkflowStore((s) => s.pipelineState);
  const [open, setOpen] = useState(false);

  const intentColors: Record<string, string> = {
    catalogo: 'text-purple-400',
    citas: 'text-blue-400',
    consulta_general: 'text-amber-400',
    out_of_scope: 'text-slate-400',
  };

  const agentColors: Record<string, string> = {
    validator: 'text-amber-400',
    specialist: 'text-purple-400',
    generic: 'text-slate-400',
  };

  return (
    <div className="border-t border-slate-200 dark:border-[#282c39] bg-slate-50 dark:bg-[#101422]/30 shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-500 hover:text-[#2559f4] hover:bg-slate-100 dark:hover:bg-[#282c39] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">terminal</span>
          <span>Pipeline Debug</span>
          {pipelineState && (
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        <span className="material-symbols-outlined text-[16px]">
          {open ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5 font-mono text-[11px]">
          {!pipelineState ? (
            <p className="text-slate-500 italic">Sin actividad aún. Envía un mensaje al Playground.</p>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">intent</span>
                <span className={intentColors[pipelineState.intent ?? ''] ?? 'text-slate-300'}>
                  {pipelineState.intent ?? '—'}
                  {pipelineState.confidence !== undefined &&
                    ` (${Math.round(pipelineState.confidence * 100)}%)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">next_agent</span>
                <span className={agentColors[pipelineState.next_agent ?? ''] ?? 'text-slate-300'}>
                  {pipelineState.next_agent ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">active_node</span>
                <span className="text-emerald-400 truncate max-w-[150px]">
                  {pipelineState.active_node ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">validation</span>
                <span className={pipelineState.is_validation_complete ? 'text-green-400' : 'text-amber-400'}>
                  {pipelineState.is_validation_complete ? 'complete' : 'pending'}
                </span>
              </div>
              {pipelineState.extracted_data && (
                <details className="mt-1">
                  <summary className="text-slate-500 cursor-pointer hover:text-slate-300">extracted_data</summary>
                  <pre className="mt-1 text-slate-400 text-[10px] overflow-x-auto">
                    {JSON.stringify(pipelineState.extracted_data, null, 2)}
                  </pre>
                </details>
              )}
              {pipelineState.reasoning && (
                <details className="mt-1">
                  <summary className="text-slate-500 cursor-pointer hover:text-slate-300">reasoning</summary>
                  <p className="mt-1 text-slate-400 text-[10px] leading-relaxed italic">
                    {pipelineState.reasoning}
                  </p>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
        <button
          onClick={resetMessages}
          title="Limpiar chat"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#282c39] rounded text-slate-500 hover:text-[#2559f4] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
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

  return (
    <aside className="w-[360px] flex flex-col border-l border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-20 shadow-xl shrink-0">
      {selectedNodeId ? (
        /* Properties panel fills the whole sidebar when a node is selected */
        <div className="flex-1 overflow-hidden flex flex-col">
          <PropertiesPanel />
        </div>
      ) : (
        /* Playground (default view) + debug console */
        <>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <PlaygroundChat />
          </div>
          <DebugConsole />
        </>
      )}
    </aside>
  );
}
