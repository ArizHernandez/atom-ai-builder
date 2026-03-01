/**
 * Telegram Webhook Handler
 * POST /api/telegram/webhook
 *
 * Receives messages from Telegram and processes them through
 * the same multi-agent orchestration pipeline as the web chat.
 *
 * Setup:
 *  1. Create bot via @BotFather → get TELEGRAM_BOT_TOKEN
 *  2. Deploy to Vercel (or use ngrok locally)
 *  3. Register webhook:
 *     GET https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook
 */

import OpenAI from 'openai';
import autosRaw from '@/app/data/autos.json';
import datesRaw from '@/app/data/dates.json';
import faqRaw   from '@/app/data/faq.json';
import { getSession, saveSession, clearSession } from '@/app/lib/telegramSessions';

// ─── Config ───────────────────────────────────────────────────────────────────
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TELEGRAM  = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Telegram types ───────────────────────────────────────────────────────────
type TelegramMessage = {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
};
type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};
type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ─── Telegram API helpers ─────────────────────────────────────────────────────
async function sendTyping(chatId: number): Promise<void> {
  await fetch(`${TELEGRAM}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

/**
 * Send a text message to a Telegram chat.
 * Automatically splits messages longer than 4096 chars (Telegram limit).
 */
async function sendMessage(chatId: number, text: string): Promise<void> {
  const MAX_LEN = 4000;
  const chunks  = text.match(new RegExp(`.{1,${MAX_LEN}}`, 'gs')) ?? [text];

  for (const chunk of chunks) {
    await fetch(`${TELEGRAM}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       chunk,
        parse_mode: 'Markdown',
      }),
    });
  }
}

// ─── RAG data ─────────────────────────────────────────────────────────────────
type Auto = {
  Marca: string; Modelo: string; Año: number; Kilometraje: number;
  Color: string; Segmento: string; Precio: number; Estado: string;
  Ciudad: string; 'Tipo de combustible': string; Motor: number;
  Transmisión: string; Descripción: string; Cantidad: number; URL: string;
};
const autos   = (autosRaw as { available_vehicles: Auto[] }).available_vehicles;
const dates   = datesRaw as { fecha: string; slots: string[] }[];
const faqCats = (faqRaw as {
  faq_agencia_autos: {
    categoria: string;
    preguntas: { id: number; pregunta: string; respuesta: string }[];
  }[];
}).faq_agencia_autos;

function buildVehicleSummary(): string {
  return JSON.stringify(
    autos.map((v) => ({
      marca: v.Marca, modelo: v.Modelo, año: v.Año,
      segmento: v.Segmento, precio_mxn: v.Precio, color: v.Color,
      transmision: v.Transmisión, combustible: v['Tipo de combustible'],
      km: v.Kilometraje, ciudad: v.Ciudad, estado: v.Estado,
      cantidad: v.Cantidad, url: v.URL,
      descripcion: v.Descripción.slice(0, 100) + '…',
    })),
    null, 2
  );
}

function buildFaqSummary(): string {
  return faqCats.flatMap((cat) => [
    `### ${cat.categoria}`,
    ...cat.preguntas.flatMap((q) => [`P: ${q.pregunta}`, `R: ${q.respuesta}`, '']),
  ]).join('\n');
}

function buildAgendaSummary(): string {
  return dates.map((d) => {
    const times = d.slots.map((s) => {
      const utcHour = parseInt(s.split('T')[1].split(':')[0], 10);
      return `${utcHour - 6}:00h`;
    });
    return `${d.fecha} (Guatemala): ${times.join(', ')}`;
  }).join('\n');
}

// ─── Orchestration ────────────────────────────────────────────────────────────
const REQUIRED_FIELDS: Record<string, string[]> = {
  catalogo:         ['presupuesto', 'preferencia'],
  citas:            ['nombre', 'fecha_preferida'],
  consulta_general: ['cliente_tipo', 'situacion_laboral'],
};

type ExtractedData = Record<string, string | number | boolean | null | undefined>;

type OrchResult = {
  intent?: string;
  confidence?: number;
  next_agent?: string;
  requires_validation?: boolean;
  extracted_data?: ExtractedData;
  reasoning?: string;
};

const ORCH_PROMPT = `Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con este JSON (sin markdown):
{
  "intent": "catalogo | citas | consulta_general | out_of_scope",
  "confidence": 0.0,
  "next_agent": "validator | specialist | generic",
  "requires_validation": true,
  "extracted_data": {
    "cliente_tipo": null, "situacion_laboral": null, "edad": null,
    "presupuesto": null, "nuevo_o_usado": null, "descuento_empleado": null, "preferencia": null,
    "nombre": null, "fecha_preferida": null, "hora_preferida": null, "motivo": null, "vehiculo_interes": null
  },
  "reasoning": "breve"
}
Reglas: catalogo/citas/consulta_general → next_agent:"validator". out_of_scope o solo saludo → next_agent:"generic", requires_validation:false.
Extrae cualquier dato que el usuario ya mencionó.`;

function buildSystemPrompt(
  role: 'validator' | 'specialist_catalogo' | 'specialist_citas' | 'specialist_general' | 'generic',
  intent: string,
  extracted: ExtractedData
): string {
  const lines: string[] = [];

  // RAG injection
  if (role === 'specialist_catalogo') {
    lines.push(
      `## CATÁLOGO DE VEHÍCULOS (${autos.length} unidades)`,
      'Usa ÚNICAMENTE estos datos. No inventes vehículos.',
      '```json', buildVehicleSummary(), '```', ''
    );
  }
  if (role === 'specialist_general' || role === 'generic') {
    lines.push(
      '## PREGUNTAS FRECUENTES',
      'Usa ÚNICAMENTE estas respuestas.',
      '', buildFaqSummary(), ''
    );
  }
  if (role === 'specialist_citas') {
    lines.push(
      '## AGENDA — HORARIOS DISPONIBLES (hora Guatemala, UTC-6)',
      'Usa ÚNICAMENTE estos slots.',
      '```', buildAgendaSummary(), '```', ''
    );
  }

  // Agent instructions
  const instructions: Record<string, string> = {
    validator: buildValidatorInstructions(intent),
    specialist_catalogo:
      'Eres el Especialista de Catálogo de AutoMóvil Premium. Filtra el inventario según el perfil del cliente (presupuesto, segmento, nuevo/usado, descuento empleado). Recomienda MÁXIMO 3 opciones. Muestra: Marca Modelo Año, Precio MXN, Ciudad, Km, Transmisión, razón breve. Si tiene descuento de empleado aplica 8% de descuento (muestra precio original y con descuento). Incluye la URL del JSON.',
    specialist_citas:
      'Eres el Especialista de Citas de AutoMóvil Premium. Verifica la disponibilidad en la agenda y confirma la cita. Si el horario no está disponible, sugiere la alternativa más cercana. Muestra resumen: nombre, fecha, hora local (Guatemala UTC-6), motivo, vehículo de interés.',
    specialist_general:
      `Eres el Especialista de Consultas de AutoMóvil Premium. Responde usando las FAQs. PERSONALIZA según perfil del cliente:\n- Nuevo + asalariado joven: enfatiza financiamiento accesible.\n- Existente: destaca beneficios de lealtad.\n- Independiente: menciona comprobantes alternativos de ingresos.`,
    generic:
      'Eres un asistente amigable de AutoMóvil Premium. Maneja saludos y preguntas generales. Si el tema no es de la concesionaria, redirige hacia: catálogo, citas o consultas.',
  };
  lines.push('## INSTRUCCIONES', instructions[role] ?? '', '');

  // Extracted data context
  const clean = Object.fromEntries(
    Object.entries(extracted).filter(([, v]) => v !== null && v !== undefined)
  );
  if (Object.keys(clean).length > 0) {
    lines.push(
      '## DATOS DEL CLIENTE (ya recopilados)',
      '```json', JSON.stringify(clean, null, 2), '```',
      'NO vuelvas a preguntar estos datos.', ''
    );
  }

  lines.push(
    '## REGLAS',
    '- Responde en español, amigable y profesional.',
    '- Nunca inventes información. Si no la tienes, dilo.',
    '- No menciones que eres una IA. Eres un asesor de AutoMóvil Premium.',
    '- Estás respondiendo por Telegram — usa formato legible, sin markdown complejo.'
  );

  return lines.join('\n');
}

function buildValidatorInstructions(intent: string): string {
  const base = 'Eres el Validador de AutoMóvil Premium. Recopila datos UN DATO A LA VEZ, de forma amigable.';
  const cases: Record<string, string> = {
    catalogo:
      `${base}\nCASO ACTIVO: Catálogo de Vehículos\nRecopila en orden:\n1. Presupuesto aproximado (MXN)\n2. ¿Nuevo o usado?\n3. ¿Tiene descuento de empleado?\n4. Tipo preferido: Sedán, SUV, Pickup, Hatchback`,
    citas:
      `${base}\nCASO ACTIVO: Agendamiento de Cita\nRecopila en orden:\n1. Nombre completo\n2. Fecha preferida\n3. Hora preferida\n4. Motivo: ¿prueba de manejo o asesoría?\n5. Vehículo de interés (si aplica)`,
    consulta_general:
      `${base}\nCASO ACTIVO: Consultas Generales\nRecopila en orden:\n1. ¿Cliente nuevo o existente?\n2. Situación laboral: ¿asalariado o independiente?\n3. Edad aproximada`,
  };
  return cases[intent] ?? base;
}

function isValidationComplete(
  intent: string,
  extracted: ExtractedData,
  turns: number,
  needsValidation: boolean
): boolean {
  if (!needsValidation) return true;
  const required = REQUIRED_FIELDS[intent] ?? [];
  if (required.length > 0) {
    const allFilled = required.every((f) => extracted[f] !== null && extracted[f] !== undefined);
    if (allFilled) return true;
  }
  return turns > 3;
}

/**
 * Run the full orchestration pipeline for a Telegram conversation.
 * Non-streaming: returns the complete response text.
 */
async function runPipeline(messages: ChatMessage[]): Promise<string> {
  // Step 1 — Classify intent (gpt-4o-mini, JSON mode)
  let orch: OrchResult = {};
  try {
    const res = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      stream:          false,
      response_format: { type: 'json_object' },
      messages:        [{ role: 'system', content: ORCH_PROMPT }, ...messages],
    });
    orch = JSON.parse(res.choices[0]?.message?.content ?? '{}') as OrchResult;
  } catch {
    orch = { intent: 'out_of_scope', next_agent: 'generic', requires_validation: false };
  }

  const intent    = orch.intent    ?? 'out_of_scope';
  const nextAgent = orch.next_agent ?? 'generic';
  const needsVal  = orch.requires_validation ?? true;
  const extracted = (orch.extracted_data ?? {}) as ExtractedData;
  const turns     = messages.filter((m) => m.role === 'user').length;
  const valDone   = isValidationComplete(intent, extracted, turns, needsVal);

  // Step 2 — Determine active agent
  let agentRole: 'validator' | 'specialist_catalogo' | 'specialist_citas' | 'specialist_general' | 'generic';

  if (intent === 'out_of_scope' || nextAgent === 'generic') {
    agentRole = 'generic';
  } else if (!valDone) {
    agentRole = 'validator';
  } else {
    const roleMap: Record<string, typeof agentRole> = {
      catalogo:         'specialist_catalogo',
      citas:            'specialist_citas',
      consulta_general: 'specialist_general',
    };
    agentRole = roleMap[intent] ?? 'generic';
  }

  // Step 3 — Generate response (gpt-4o, non-streaming for Telegram)
  const systemPrompt = buildSystemPrompt(agentRole, intent, extracted);
  const completion   = await openai.chat.completions.create({
    model:    'gpt-4o',
    stream:   false,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  return completion.choices[0]?.message?.content ?? 'Lo siento, hubo un error. Intenta de nuevo.';
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  // Telegram always expects a 200 OK, even on errors
  try {
    if (!BOT_TOKEN) {
      console.error('[telegram] TELEGRAM_BOT_TOKEN not set');
      return new Response('OK');
    }

    const update = (await request.json()) as TelegramUpdate;
    const msg    = update.message;

    // Ignore non-text messages (photos, stickers, etc.)
    if (!msg?.text) return new Response('OK');

    const chatId   = msg.chat.id;
    const userText = msg.text.trim();

    // Ignore bot commands (except /start)
    if (userText.startsWith('/') && userText !== '/start') {
      return new Response('OK');
    }

    // Handle /start command
    if (userText === '/start') {
      clearSession(chatId); // Clear session on restart
      await sendMessage(
        chatId,
        '¡Hola! 👋 Soy el asistente de *AutoMóvil Premium*.\n\nPuedo ayudarte con:\n• 🚗 Catálogo de vehículos y precios\n• 📅 Agendar citas y pruebas de manejo\n• ❓ Consultas sobre la concesionaria\n\n¿En qué te puedo ayudar hoy?'
      );
      return new Response('OK');
    }

    // Get or create session
    const history = getSession(chatId);

    // Show typing indicator (non-blocking)
    sendTyping(chatId).catch(() => {});

    // Add user message to history
    history.push({ role: 'user', content: userText });

    // Run pipeline
    const response = await runPipeline(history);

    // Add assistant response to history and save
    history.push({ role: 'assistant', content: response });
    saveSession(chatId, history);

    // Send response to Telegram
    await sendMessage(chatId, response);

  } catch (error) {
    console.error('[telegram/webhook] error:', error);
    // Don't throw — Telegram will retry on error, causing duplicate responses
  }

  return new Response('OK');
}

// ─── GET: Webhook verification (optional, for manual testing) ─────────────────
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status:  'ok',
      message: 'Telegram webhook is live. Use POST for updates.',
      bot:     BOT_TOKEN ? 'configured' : 'NOT configured — set TELEGRAM_BOT_TOKEN',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
