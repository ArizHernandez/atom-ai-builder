/**
 * Debug endpoint — only active in development
 * GET /api/debug/memory
 *
 * Shows current in-memory state:
 * - Telegram sessions (chat_id → messages)
 * - Server uptime
 *
 * Usage:
 *   http://localhost:3000/api/debug/memory
 *   curl http://localhost:3000/api/debug/memory | jq
 */

// Import the sessions map from the Telegram webhook module.
// Since Next.js runs both in the same process in dev, the module is shared.
// In production (Vercel serverless), each invocation is isolated — sessions reset per cold start.
import { telegramSessions } from '@/app/lib/telegramSessions';

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({ error: 'Debug endpoint disabled in production' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const sessions: Record<string, unknown> = {};
  for (const [chatId, messages] of telegramSessions.entries()) {
    sessions[String(chatId)] = {
      message_count: messages.length,
      messages: messages.map((m, i) => ({
        index: i,
        role: m.role,
        preview: m.content.slice(0, 120) + (m.content.length > 120 ? '…' : ''),
      })),
    };
  }

  return new Response(
    JSON.stringify(
      {
        timestamp:       new Date().toISOString(),
        environment:     process.env.NODE_ENV,
        telegram_sessions: {
          total_chats:  telegramSessions.size,
          chats:        sessions,
        },
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
