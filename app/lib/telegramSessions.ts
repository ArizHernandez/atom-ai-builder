/**
 * Shared in-memory session store for Telegram conversations.
 *
 * Each Telegram chat has its own message history array.
 * This module is imported by:
 *   - app/api/telegram/webhook/route.ts  (read/write)
 *   - app/api/debug/memory/route.ts      (read-only)
 *
 * ⚠️  Important for production (Vercel):
 *   Vercel uses serverless functions — each cold start creates a fresh Map.
 *   Sessions DO persist between requests on the same warm instance,
 *   but will reset if the function scales down or redeploys.
 *   For true persistence, replace with Firestore / Redis / KV store.
 */

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Global singleton session store: chatId → conversation history */
export const telegramSessions = new Map<number, ChatMessage[]>();

const MAX_HISTORY = 20;

/** Get the message history for a chat (creates empty array if new) */
export function getSession(chatId: number): ChatMessage[] {
  if (!telegramSessions.has(chatId)) {
    telegramSessions.set(chatId, []);
  }
  return telegramSessions.get(chatId)!;
}

/** Save updated message history, trimming to MAX_HISTORY */
export function saveSession(chatId: number, messages: ChatMessage[]): void {
  telegramSessions.set(chatId, messages.slice(-MAX_HISTORY));
}

/** Clear a specific chat session */
export function clearSession(chatId: number): void {
  telegramSessions.delete(chatId);
}
