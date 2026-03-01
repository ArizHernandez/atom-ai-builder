import OpenAI from 'openai';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '@/app/types/workflow';
import autosRaw from '@/app/data/autos.json';
import datesRaw from '@/app/data/dates.json';
import faqRaw   from '@/app/data/faq.json';

// ─── Typed shortcuts ──────────────────────────────────────────────────────────
type Auto = {
  Marca: string; Modelo: string; Año: number; Kilometraje: number;
  Color: string; Segmento: string; Precio: number; Estado: string;
  Ciudad: string; 'Tipo de combustible': string; Motor: number;
  Transmisión: string; Descripción: string; Cantidad: number; URL: string;
};
const autos   = (autosRaw as { available_vehicles: Auto[] }).available_vehicles;
const dates   = datesRaw as { fecha: string; slots: string[] }[];
const faqCats = (faqRaw as {
  faq_agencia_autos: { categoria: string; preguntas: { id: number; pregunta: string; respuesta: string }[] }[]
}).faq_agencia_autos;

// ─── Required validation fields per intent ────────────────────────────────────
const REQUIRED_FIELDS_BY_INTENT: Record<string, string[]> = {
  catalogo:         ['presupuesto', 'preferencia'],
  citas:            ['nombre', 'fecha_preferida'],
  consulta_general: ['cliente_tipo', 'situacion_laboral'],
};

// ─── RAG builders ─────────────────────────────────────────────────────────────

/**
 * Build a compact vehicle summary (key fields only, 120-char description)
 * to avoid token overflow with the full autos.json.
 */
function buildVehicleSummary(vehicles: Auto[]): string {
  const rows = vehicles.map((v) => ({
    marca:             v.Marca,
    modelo:            v.Modelo,
    año:               v.Año,
    segmento:          v.Segmento,
    precio_mxn:        v.Precio,
    color:             v.Color,
    transmision:       v.Transmisión,
    combustible:       v['Tipo de combustible'],
    km:                v.Kilometraje,
    ciudad:            v.Ciudad,
    estado:            v.Estado,
    cantidad:          v.Cantidad,
    descripcion_corta: v.Descripción.slice(0, 120) + '…',
  }));
  return JSON.stringify(rows, null, 2);
}

/** Build a flat FAQ list the LLM can scan quickly */
function buildFaqSummary(): string {
  const lines: string[] = [];
  for (const cat of faqCats) {
    lines.push(`### ${cat.categoria}`);
    for (const q of cat.preguntas) {
      lines.push(`P: ${q.pregunta}`);
      lines.push(`R: ${q.respuesta}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

/** Build a compact agenda with human-readable time slots (UTC → Guatemala UTC-6) */
function buildAgendaSummary(): string {
  return dates
    .map((d) => {
      const times = d.slots.map((s) => {
        const utcHour = parseInt(s.split('T')[1].split(':')[0], 10);
        const gtHour  = utcHour - 6;
        return `${gtHour}:00h`;
      });
      return `${d.fecha} (Guatemala): ${times.join(', ')}`;
    })
    .join('\n');
}

// ─── OpenAI client ────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────
type ExtractedData = Record<string, string | number | boolean | null | undefined>;

type OrchestratorResult = {
  intent?: string;
  confidence?: number;
  next_agent?: string;
  requires_validation?: boolean;
  extracted_data?: ExtractedData;
  reasoning?: string;
};

// ─── Node helpers ─────────────────────────────────────────────────────────────

/** Find a node by React Flow type (first match) */
function findNode(nodes: Node<WorkflowNodeData>[], type: WorkflowNodeData['type']) {
  return nodes.find((n) => n.data?.type === type) ?? null;
}

/** Find all nodes of a given React Flow type */
function findNodes(nodes: Node<WorkflowNodeData>[], type: WorkflowNodeData['type']) {
  return nodes.filter((n) => n.data?.type === type);
}

/**
 * Pick the best specialist node for a given intent.
 * Matches by agent_role first, falls back to label keyword, then first specialist.
 */
function findSpecialistForIntent(
  intent: string,
  nodes: Node<WorkflowNodeData>[]
): Node<WorkflowNodeData> | null {
  const specialists = findNodes(nodes, 'specialist');
  if (specialists.length === 0) return null;

  const roleMap: Record<string, string> = {
    catalogo:         'specialist_catalogo',
    citas:            'specialist_citas',
    consulta_general: 'specialist_general',
  };

  const role  = roleMap[intent];
  if (role) {
    const match = specialists.find((n) => n.data.config?.agent_role === role);
    if (match) return match;
  }

  // Fallback: keyword in label
  const lower = intent.toLowerCase();
  const kw    = specialists.find((n) =>
    n.data.label.toLowerCase().includes(lower) ||
    n.data.label.toLowerCase().includes('catálogo') ||
    n.data.label.toLowerCase().includes('catalogo')
  );
  return kw ?? specialists[0];
}

/**
 * Determine whether the validator has collected enough data for the given intent.
 * Uses per-intent required field list; falls back to a conversation-turns heuristic.
 */
function checkValidationComplete(
  intent: string,
  extracted: ExtractedData,
  conversationTurns: number,
  needsValidation: boolean
): boolean {
  if (!needsValidation) return true;

  const required = REQUIRED_FIELDS_BY_INTENT[intent] ?? [];

  if (required.length > 0) {
    // All required fields must be non-null
    const allFilled = required.every(
      (f) => extracted[f] !== null && extracted[f] !== undefined
    );
    if (allFilled) return true;
  }

  // Fallback: after 3+ user turns the validator has had enough chances
  return conversationTurns > 3;
}

// ─── System-prompt builders ───────────────────────────────────────────────────

/** Build the RAG context block from a node's config flags */
function buildRagContext(node: Node<WorkflowNodeData>): string {
  const lines: string[] = [];
  const { config }      = node.data;

  if (config.use_inventory) {
    lines.push(
      `## CATÁLOGO DE VEHÍCULOS DISPONIBLES (${autos.length} unidades)`,
      'Usa ÚNICAMENTE estos datos para responder. No inventes modelos ni precios.',
      '```json',
      buildVehicleSummary(autos),
      '```',
      ''
    );
  }

  if (config.use_faqs) {
    lines.push(
      '## PREGUNTAS FRECUENTES DE LA CONCESIONARIA',
      'Usa ÚNICAMENTE estas respuestas para consultas. No inventes políticas.',
      '',
      buildFaqSummary(),
      ''
    );
  }

  if (config.use_agenda) {
    lines.push(
      '## AGENDA — HORARIOS DISPONIBLES (hora local Guatemala, UTC-6)',
      'Usa ÚNICAMENTE estos slots. No confirmes horarios que no aparezcan aquí.',
      '```',
      buildAgendaSummary(),
      '```',
      ''
    );
  }

  return lines.join('\n');
}

/**
 * Build the full system prompt for the active agent node.
 * For validators, injects the detected intent so it knows which fields to ask for.
 */
function buildAgentSystemPrompt(
  node: Node<WorkflowNodeData>,
  extractedData?: ExtractedData | null,
  detectedIntent?: string
): string {
  const lines: string[] = [];
  const { config, type } = node.data;

  // 1. RAG data first (grounds the model before instructions)
  const ragCtx = buildRagContext(node);
  if (ragCtx) lines.push(ragCtx);

  // 2. Agent-type instructions
  if (type === 'specialist' || type === 'orchestrator' || type === 'generic') {
    if (config.system_prompt) {
      lines.push('## INSTRUCCIONES DEL AGENTE', config.system_prompt, '');
    }
  }

  if (type === 'validator') {
    // Make the validator intent-aware: tell it which case of use is active
    const intentLabel: Record<string, string> = {
      catalogo:         'Catálogo de Vehículos',
      citas:            'Agendamiento de Cita',
      consulta_general: 'Consultas Generales',
    };
    const caseLabel = detectedIntent ? (intentLabel[detectedIntent] ?? 'desconocido') : 'desconocido';

    lines.push(
      '## INSTRUCCIONES DEL VALIDADOR',
      config.description ||
        'Recopila los datos necesarios del cliente de forma conversacional, una pregunta a la vez.',
      '',
      `## CASO DE USO ACTIVO: ${caseLabel.toUpperCase()}`,
      detectedIntent === 'catalogo'
        ? 'Recopila en este orden: (1) presupuesto en MXN, (2) ¿nuevo o usado?, (3) ¿descuento de empleado?, (4) tipo de vehículo preferido (Sedán/SUV/Pickup/Hatchback).'
        : detectedIntent === 'citas'
        ? 'Recopila en este orden: (1) nombre completo, (2) fecha preferida, (3) hora preferida, (4) motivo (prueba de manejo o asesoría), (5) vehículo de interés si aplica.'
        : 'Recopila en este orden: (1) ¿cliente nuevo o existente?, (2) situación laboral (asalariado/independiente), (3) edad aproximada.',
      ''
    );
  }

  // 3. Extracted data so the agent can personalise and avoid re-asking
  if (extractedData && Object.keys(extractedData).length > 0) {
    const clean = Object.fromEntries(
      Object.entries(extractedData).filter(([, v]) => v !== null && v !== undefined)
    );
    if (Object.keys(clean).length > 0) {
      lines.push(
        '## DATOS YA RECOPILADOS DEL CLIENTE',
        '```json',
        JSON.stringify(clean, null, 2),
        '```',
        'Usa estos datos para personalizar tu respuesta. NO los vuelvas a preguntar.',
        ''
      );
    }
  }

  // 4. Universal ground rules
  lines.push(
    '## REGLAS GENERALES',
    '- Responde siempre en español, de forma amigable y profesional.',
    '- Sé conciso. Si no tienes información, dilo honestamente — nunca inventes datos.',
    '- No menciones que eres una IA. Eres un asesor de AutoMóvil Premium.'
  );

  return lines.join('\n');
}

/** Fallback prompt when the canvas has no orchestrator node */
function buildFallbackSystemPrompt(nodes: Node<WorkflowNodeData>[]): string {
  const lines: string[] = [
    'Eres un asesor de ventas de AutoMóvil Premium.',
    'Puedes ayudar con catálogo de vehículos, agendamiento de citas y consultas generales.',
    '',
  ];

  for (const node of nodes) {
    const ctx = buildRagContext(node);
    if (ctx) lines.push(ctx);
    if (node.data.type === 'specialist' && node.data.config.system_prompt) {
      lines.push(node.data.config.system_prompt, '');
    }
  }

  const anyRag = nodes.some(
    (n) => n.data.config.use_inventory || n.data.config.use_faqs || n.data.config.use_agenda
  );
  if (!anyRag) {
    lines.push(
      `## CATÁLOGO DE VEHÍCULOS (${autos.length} unidades)`,
      '```json', buildVehicleSummary(autos), '```', '',
      '## PREGUNTAS FRECUENTES', buildFaqSummary(), '',
      '## AGENDA DE CITAS', buildAgendaSummary(), ''
    );
  }

  lines.push('Responde en español, sé amigable y profesional. Nunca inventes información.');
  return lines.join('\n');
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────
function sseEvent(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

// ─── Default orchestrator prompt (used when node has no system_prompt) ────────
const DEFAULT_ORCH_PROMPT = `Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con este JSON (sin markdown ni texto adicional):
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
  "reasoning": "breve explicación"
}
Reglas: catalogo/citas/consulta_general → next_agent:"validator". out_of_scope o solo saludo → next_agent:"generic", requires_validation:false.
Extrae CUALQUIER dato que el usuario ya mencionó.`;

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages,
      workflow,
    }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      workflow?: { nodes: Node<WorkflowNodeData>[] };
    } = body;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nodes           = workflow?.nodes ?? [];
    const orchestratorNode = findNode(nodes, 'orchestrator');

    const readable = new ReadableStream({
      async start(controller) {
        try {

          // ── A. Orchestrated pipeline ───────────────────────────────────────
          if (orchestratorNode) {
            const orchPrompt = orchestratorNode.data.config.system_prompt || DEFAULT_ORCH_PROMPT;

            // Step 1 — Intent classification (gpt-4o-mini, fast + cheap, JSON mode)
            let orchResult: OrchestratorResult = {};
            try {
              const classifyRes = await openai.chat.completions.create({
                model:           'gpt-4o-mini',
                stream:          false,
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: orchPrompt },
                  ...messages,
                ],
              });
              orchResult = JSON.parse(
                classifyRes.choices[0]?.message?.content ?? '{}'
              ) as OrchestratorResult;
            } catch {
              orchResult = { intent: 'out_of_scope', next_agent: 'generic', confidence: 0.5 };
            }

            const intent          = orchResult.intent    ?? 'out_of_scope';
            const nextAgent       = orchResult.next_agent ?? 'generic';
            const needsValidation = orchResult.requires_validation ?? true;
            const extracted       = (orchResult.extracted_data ?? {}) as ExtractedData;
            const conversationTurns = messages.filter((m) => m.role === 'user').length;

            // Per-intent validation check (replaces the old simple heuristic)
            const isValidationComplete = checkValidationComplete(
              intent, extracted, conversationTurns, needsValidation
            );

            // Step 2 — Route to the right agent node
            let activeNode: string;
            let agentNode: Node<WorkflowNodeData> | null;

            if (intent === 'out_of_scope' || nextAgent === 'generic') {
              agentNode  = findNode(nodes, 'generic');
              activeNode = agentNode?.data.label ?? 'Agente Genérico';
            } else if (!isValidationComplete && findNode(nodes, 'validator')) {
              agentNode  = findNode(nodes, 'validator');
              activeNode = agentNode?.data.label ?? 'Agente Validador';
            } else {
              agentNode  = findSpecialistForIntent(intent, nodes);
              activeNode = agentNode?.data.label ?? 'Agente Especialista';
            }

            // Step 3 — Emit pipeline_state event (debug console)
            controller.enqueue(
              sseEvent({
                type:                   'pipeline_state',
                intent,
                confidence:             orchResult.confidence,
                next_agent:             nextAgent,
                active_node:            activeNode,
                requires_validation:    needsValidation,
                is_validation_complete: isValidationComplete,
                extracted_data:         extracted,
                reasoning:              orchResult.reasoning,
              })
            );

            // Step 4 — Build system prompt for the active agent
            const systemPrompt = agentNode
              ? buildAgentSystemPrompt(agentNode, extracted, intent)
              : buildFallbackSystemPrompt(nodes);

            // Step 5 — Stream response (gpt-4o)
            const stream = await openai.chat.completions.create({
              model:    'gpt-4o',
              stream:   true,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) controller.enqueue(sseEvent({ content }));
            }

          } else {
            // ── B. No orchestrator — simple single-agent fallback ─────────────
            const systemPrompt = buildFallbackSystemPrompt(nodes);
            const stream = await openai.chat.completions.create({
              model:    'gpt-4o',
              stream:   true,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
            });
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) controller.enqueue(sseEvent({ content }));
            }
          }

          controller.enqueue(sseDone());

        } catch (err) {
          console.error('[chat/route] stream error:', err);
          controller.enqueue(sseEvent({ content: '\n\nError interno del servidor.' }));
          controller.enqueue(sseDone());
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection:      'keep-alive',
      },
    });

  } catch (error) {
    console.error('[chat/route] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
