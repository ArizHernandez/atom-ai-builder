import OpenAI from 'openai';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '@/app/types/workflow';
import inventory from '@/app/data/inventory.json';
import faqs      from '@/app/data/faqs.json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type OrchestratorResult = {
  intent?: string;
  confidence?: number;
  next_agent?: string;
  requires_validation?: boolean;
  extracted_data?: Record<string, unknown>;
  reasoning?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find a node by type (first match) */
function findNode(nodes: Node<WorkflowNodeData>[], type: WorkflowNodeData['type']) {
  return nodes.find((n) => n.data?.type === type) ?? null;
}

/** Find all nodes of a given type */
function findNodes(nodes: Node<WorkflowNodeData>[], type: WorkflowNodeData['type']) {
  return nodes.filter((n) => n.data?.type === type);
}

/** Pick the best specialist node for a given intent */
function findSpecialistForIntent(
  intent: string,
  nodes: Node<WorkflowNodeData>[]
): Node<WorkflowNodeData> | null {
  const specialists = findNodes(nodes, 'specialist');
  if (specialists.length === 0) return null;

  // Match by agent_role first
  const roleMap: Record<string, string> = {
    catalogo:         'specialist_catalogo',
    citas:            'specialist_citas',
    consulta_general: 'specialist_general',
  };
  const role = roleMap[intent];
  if (role) {
    const match = specialists.find((n) => n.data.config?.agent_role === role);
    if (match) return match;
  }

  // Fallback: label keyword match
  const lower = intent.toLowerCase();
  const kw = specialists.find(
    (n) =>
      n.data.label.toLowerCase().includes(lower) ||
      n.data.label.toLowerCase().includes('catálogo') ||
      n.data.label.toLowerCase().includes('catalogo')
  );
  return kw ?? specialists[0];
}

/** Build the RAG context string from a node's config */
function buildRagContext(node: Node<WorkflowNodeData>): string {
  const lines: string[] = [];
  const { config } = node.data;

  if (config.use_inventory) {
    lines.push(
      '## INVENTARIO DE VEHÍCULOS (usa ÚNICAMENTE estos datos para responder preguntas de catálogo)',
      '```json',
      JSON.stringify(inventory, null, 2),
      '```',
      ''
    );
  }

  if (config.use_faqs) {
    lines.push(
      '## PREGUNTAS FRECUENTES (usa ÚNICAMENTE estas FAQs para responder consultas generales)',
      '```json',
      JSON.stringify(faqs, null, 2),
      '```',
      ''
    );
  }

  if (config.use_agenda) {
    // agenda is embedded inside inventory.json
    const slots = (inventory as { test_drive_slots?: unknown }).test_drive_slots;
    if (slots) {
      lines.push(
        '## AGENDA — HORARIOS DISPONIBLES PARA PRUEBAS DE MANEJO',
        '```json',
        JSON.stringify(slots, null, 2),
        '```',
        ''
      );
    }
  }

  return lines.join('\n');
}

/** Build the system prompt for a specific agent node */
function buildAgentSystemPrompt(
  node: Node<WorkflowNodeData>,
  extractedData?: Record<string, unknown> | null
): string {
  const lines: string[] = [];
  const { config, type } = node.data;

  // RAG data first (ground the model before instructions)
  const ragCtx = buildRagContext(node);
  if (ragCtx) lines.push(ragCtx);

  // Node-specific instructions
  if (type === 'specialist' || type === 'orchestrator' || type === 'generic') {
    if (config.system_prompt) {
      lines.push('## INSTRUCCIONES DEL AGENTE', config.system_prompt, '');
    }
  }

  if (type === 'validator') {
    lines.push(
      '## INSTRUCCIONES DEL VALIDADOR',
      config.description ||
        'Recopila los datos necesarios del cliente de forma conversacional, una pregunta a la vez.',
      ''
    );
  }

  // Pass along extracted data so the agent can personalise the response
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
        'Usa estos datos para personalizar tu respuesta. No vuelvas a pedirlos.',
        ''
      );
    }
  }

  lines.push(
    '## REGLAS GENERALES',
    '- Responde siempre en español, de forma amigable y profesional.',
    '- Sé conciso. Si no tienes información, dilo honestamente — nunca inventes datos.',
    '- No menciones que eres una IA. Eres un asesor de AutoMóvil Premium.'
  );

  return lines.join('\n');
}

/** Fallback system prompt when no orchestrator is configured */
function buildFallbackSystemPrompt(nodes: Node<WorkflowNodeData>[]): string {
  const lines: string[] = [
    'Eres un asistente de ventas de AutoMóvil Premium.',
    'Ayuda con catálogo de vehículos, citas y consultas generales.',
    '',
  ];

  for (const node of nodes) {
    const { type, config } = node.data;
    if (type === 'specialist' && config.use_inventory) {
      lines.push(buildRagContext(node));
    }
    if (type === 'specialist' && config.system_prompt) {
      lines.push(config.system_prompt, '');
    }
  }

  lines.push(
    'Responde en español, sé amigable y profesional.',
    'Nunca inventes información.'
  );
  return lines.join('\n');
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────
function sseEvent(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

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

    const nodes = workflow?.nodes ?? [];
    const orchestratorNode = findNode(nodes, 'orchestrator');

    // ── Stream back to client ────────────────────────────────────────────────
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // ── A. Orchestrated pipeline (has orchestrator node) ───────────────
          if (orchestratorNode) {
            const orchPrompt =
              orchestratorNode.data.config.system_prompt ||
              // Sensible default so the pipeline works even with empty config
              `Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con JSON:
{
  "intent": "catalogo | citas | consulta_general | out_of_scope",
  "confidence": 0.0-1.0,
  "next_agent": "validator | specialist | generic",
  "requires_validation": true,
  "extracted_data": { "cliente_tipo": null, "presupuesto": null, "preferencia": null, "nombre": null, "fecha_preferida": null },
  "reasoning": "breve explicación"
}`;

            // Step 1 — Classify intent (fast, non-streaming, cheap model)
            let orchResult: OrchestratorResult = {};
            try {
              const classifyRes = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                stream: false,
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
              // If classification fails, fall through to generic
              orchResult = { intent: 'out_of_scope', next_agent: 'generic', confidence: 0.5 };
            }

            const intent    = orchResult.intent    ?? 'out_of_scope';
            const nextAgent = orchResult.next_agent ?? 'generic';
            const needsValidation = orchResult.requires_validation ?? true;

            // Determine if validation is complete by scanning conversation history
            // Simple heuristic: if the extracted_data has at least one non-null value
            // AND the conversation has more than 2 turns, we consider it complete
            const extracted = (orchResult.extracted_data ?? {}) as Record<string, unknown>;
            const filledFields = Object.values(extracted).filter((v) => v !== null && v !== undefined).length;
            const conversationTurns = messages.filter((m) => m.role === 'user').length;
            const isValidationComplete = !needsValidation || filledFields >= 1 || conversationTurns > 2;

            // Determine the active node label for the debug panel
            let activeNode: string;
            let agentNode: Node<WorkflowNodeData> | null;

            if (intent === 'out_of_scope' || nextAgent === 'generic') {
              agentNode  = findNode(nodes, 'generic');
              activeNode = agentNode?.data.label ?? 'Agente Genérico';
            } else if (!isValidationComplete && findNode(nodes, 'validator')) {
              agentNode  = findNode(nodes, 'validator');
              activeNode = agentNode?.data.label ?? 'Agente Validador';
            } else if (nextAgent === 'specialist' || intent !== 'out_of_scope') {
              agentNode  = findSpecialistForIntent(intent, nodes);
              activeNode = agentNode?.data.label ?? 'Agente Especialista';
            } else {
              agentNode  = findNode(nodes, 'generic');
              activeNode = agentNode?.data.label ?? 'Agente Genérico';
            }

            // Step 2 — Emit pipeline_state SSE event (visible in debug console)
            controller.enqueue(
              sseEvent({
                type:                  'pipeline_state',
                intent,
                confidence:            orchResult.confidence,
                next_agent:            nextAgent,
                active_node:           activeNode,
                requires_validation:   needsValidation,
                is_validation_complete: isValidationComplete,
                extracted_data:        extracted,
                reasoning:             orchResult.reasoning,
              })
            );

            // Step 3 — Stream response from the active agent
            const systemPrompt = agentNode
              ? buildAgentSystemPrompt(agentNode, extracted)
              : buildFallbackSystemPrompt(nodes);

            const stream = await openai.chat.completions.create({
              model: 'gpt-4o',
              stream: true,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(sseEvent({ content }));
              }
            }
          } else {
            // ── B. No orchestrator — simple single-agent fallback ─────────────
            const systemPrompt = buildFallbackSystemPrompt(nodes);

            const stream = await openai.chat.completions.create({
              model: 'gpt-4o',
              stream: true,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(sseEvent({ content }));
              }
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
