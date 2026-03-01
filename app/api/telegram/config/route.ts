import { telegramConfig } from '@/app/lib/telegramConfig';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        telegramConfig.isActive = !!data.isActive;
        telegramConfig.botToken = data.botToken || '';

        return new Response(JSON.stringify({ success: true, telegramConfig }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }
}
