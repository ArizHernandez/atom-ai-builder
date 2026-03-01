'use client';

import { useCallback } from 'react';
import { useWorkflowStore } from '@/app/store/workflowStore';
import type { PipelineState } from '@/app/types/workflow';

export function useChat() {
  const {
    messages,
    nodes,
    isStreaming,
    addMessage,
    appendToLastAssistantMessage,
    setIsStreaming,
    setPipelineState,
    abortController,
    setAbortController,
  } = useWorkflowStore();

  const sendMessage = useCallback(
    async (userContent: string) => {
      const content = userContent.trim();
      if (!content || isStreaming) return;

      const historySnapshot = [...messages];

      addMessage({ role: 'user', content });
      addMessage({ role: 'assistant', content: '' });
      setIsStreaming(true);

      const newController = new AbortController();
      setAbortController(newController);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...historySnapshot, { role: 'user', content }],
            workflow: { nodes },
          }),
          signal: newController.signal,
        });

        if (!response.ok || !response.body) {
          appendToLastAssistantMessage(
            'Error: no se pudo conectar con la API. Verifica tu OPENAI_API_KEY.'
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n\n').filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break;

            try {
              const parsed = JSON.parse(raw) as {
                type?: string;
                content?: string;
              } & Partial<PipelineState>;

              if (parsed.type === 'pipeline_state') {
                // Orchestrator analysis result — update debug console
                setPipelineState({
                  intent: parsed.intent,
                  confidence: parsed.confidence,
                  active_node: parsed.active_node,
                  next_agent: parsed.next_agent,
                  requires_validation: parsed.requires_validation,
                  is_validation_complete: parsed.is_validation_complete,
                  extracted_data: parsed.extracted_data,
                  reasoning: parsed.reasoning,
                });
              } else if (parsed.content) {
                // Streaming text chunk from the active agent
                appendToLastAssistantMessage(parsed.content);
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('[useChat] fetch aborted');
          return;
        }
        console.error('[useChat] error:', err);
        appendToLastAssistantMessage('Error: fallo en la conexión.');
      } finally {
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [messages, nodes, isStreaming, addMessage, appendToLastAssistantMessage, setIsStreaming, setPipelineState, setAbortController]
  );

  return { messages, isStreaming, sendMessage };
}
