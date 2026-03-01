'use client';

import { useCallback } from 'react';
import { useWorkflowStore } from '@/app/store/workflowStore';

export function useChat() {
  const {
    messages,
    nodes,
    isStreaming,
    addMessage,
    appendToLastAssistantMessage,
    setIsStreaming,
  } = useWorkflowStore();

  const sendMessage = useCallback(
    async (userContent: string) => {
      const content = userContent.trim();
      if (!content || isStreaming) return;

      // Snapshot current history BEFORE adding new messages (used for the API body)
      const historySnapshot = [...messages];

      // Optimistically add user message to the store
      addMessage({ role: 'user', content });

      // Add an empty assistant placeholder that will be filled via streaming
      addMessage({ role: 'assistant', content: '' });
      setIsStreaming(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...historySnapshot, { role: 'user', content }],
            workflow: { nodes },
          }),
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

          // Each SSE message is separated by '\n\n'
          const lines = text.split('\n\n').filter(Boolean);
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6); // Remove "data: "
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { content?: string };
              if (parsed.content) {
                appendToLastAssistantMessage(parsed.content);
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } catch (err) {
        console.error('[useChat] sendMessage error:', err);
        appendToLastAssistantMessage('Error: fallo en la conexión.');
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, nodes, isStreaming, addMessage, appendToLastAssistantMessage, setIsStreaming]
  );

  return { messages, isStreaming, sendMessage };
}
