'use client';

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import type { WorkflowNodeData, WorkflowMeta, ChatMessage, PipelineState } from '@/app/types/workflow';

// ─── Demo: Concesionaria AutoMóvil Premium — 3 casos de uso completos ─────────
const ORCH_SYSTEM_PROMPT = `Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con este JSON (sin markdown):
{
  "intent": "catalogo | citas | consulta_general | out_of_scope",
  "confidence": 0.0-1.0,
  "next_agent": "validator | specialist | generic",
  "requires_validation": true/false,
  "extracted_data": {
    "cliente_tipo": null,
    "situacion_laboral": null,
    "edad": null,
    "presupuesto": null,
    "nuevo_o_usado": null,
    "descuento_empleado": null,
    "preferencia": null,
    "nombre": null,
    "fecha_preferida": null,
    "hora_preferida": null,
    "motivo": null,
    "vehiculo_interes": null
  },
  "reasoning": "explicación breve"
}

Reglas de routing:
- "catalogo": el cliente pregunta por autos, precios, inventario → next_agent: "validator"
- "citas": el cliente quiere agendar cita o prueba de manejo → next_agent: "validator"
- "consulta_general": preguntas sobre la concesionaria, financiamiento, garantías, horarios → next_agent: "validator"
- "out_of_scope": tema fuera del negocio (política, recetas, etc.) → next_agent: "generic"
- Si el cliente solo saluda → intent: "out_of_scope", next_agent: "generic", requires_validation: false
Extrae CUALQUIER dato que el cliente ya haya mencionado y colócalo en extracted_data. Deja null los que no mencionó.`;

const VALIDATOR_DESCRIPTION = `Eres el Agente Validador de AutoMóvil Premium. Tu rol es recopilar los datos necesarios del cliente de forma conversacional y amigable, UN DATO A LA VEZ.

CASO: Catálogo de Vehículos — recopila en este orden:
1. Presupuesto aproximado (en MXN)
2. ¿Nuevo o usado?
3. ¿Cuenta con descuento de empleado? (sí/no)
4. Preferencia de tipo: Sedán, SUV, Pickup, Hatchback

CASO: Agendamiento de Cita — recopila en este orden:
1. Nombre completo del cliente
2. Fecha preferida (ej. 5 de marzo)
3. Hora preferida (ej. 10am, 3pm)
4. Motivo: ¿prueba de manejo o asesoría con un vendedor?
5. Vehículo de interés (si aplica)

CASO: Consultas Generales — recopila en este orden:
1. ¿Es cliente nuevo o existente?
2. Situación laboral: ¿asalariado o independiente?
3. Edad aproximada

Cuando tengas TODOS los datos necesarios para el caso de uso actual, confirma amablemente que ya tienes la información completa y di que procederás a buscar la información.`;

const INITIAL_NODES: Node<WorkflowNodeData>[] = [
  {
    id: 'node-start',
    type: 'start',
    position: { x: 60, y: 460 },
    data: {
      id: 'node-start',
      type: 'start',
      label: 'Canal Web',
      subtitle: 'Mensaje entrante',
      config: {},
    },
  },
  {
    id: 'node-telegram',
    type: 'telegram',
    position: { x: 60, y: 650 },
    data: {
      id: 'node-telegram',
      type: 'telegram',
      label: 'Canal Telegram',
      subtitle: 'Bot de mensajería',
      config: {},
    },
  },
  {
    id: 'node-memory',
    type: 'memory',
    position: { x: 340, y: 460 },
    data: {
      id: 'node-memory',
      type: 'memory',
      label: 'Nodo de Memoria',
      subtitle: 'Contexto de sesión',
      config: {},
    },
  },
  {
    id: 'node-orchestrator',
    type: 'orchestrator',
    position: { x: 630, y: 460 },
    data: {
      id: 'node-orchestrator',
      type: 'orchestrator',
      label: 'Agente Orquestador',
      subtitle: 'Router de intenciones',
      config: {
        agent_role: 'orchestrator',
        system_prompt: ORCH_SYSTEM_PROMPT,
      },
    },
  },
  {
    id: 'node-validator',
    type: 'validator',
    position: { x: 950, y: 180 },
    data: {
      id: 'node-validator',
      type: 'validator',
      label: 'Agente Validador',
      subtitle: 'Recopila datos del cliente',
      config: {
        agent_role: 'validator',
        description: VALIDATOR_DESCRIPTION,
        validation_fields: [
          'presupuesto', 'preferencia', 'nuevo_o_usado', 'descuento_empleado', // catálogo
          'nombre', 'fecha_preferida', 'hora_preferida', 'motivo',             // citas
          'cliente_tipo', 'situacion_laboral', 'edad',                         // consultas
        ],
      },
    },
  },
  {
    id: 'node-specialist-catalogo',
    type: 'specialist',
    position: { x: 950, y: 420 },
    data: {
      id: 'node-specialist-catalogo',
      type: 'specialist',
      label: 'Especialista Catálogo',
      subtitle: 'Vehículos y precios',
      config: {
        agent_role: 'specialist_catalogo',
        system_prompt:
          `Eres el Especialista de Catálogo de AutoMóvil Premium.

Tu única función es recomendar vehículos exclusivamente del inventario proporcionado.
No tienes acceso a información externa.

Reglas

Usa únicamente datos del inventario.

No inventes vehículos ni información.

No respondas preguntas fuera del catálogo.

Si preguntan algo fuera del inventario responde exactamente:

Solo puedo brindarte información sobre los vehículos disponibles actualmente en nuestro inventario.

Si no hay coincidencias con el perfil responde exactamente:

Actualmente no contamos con opciones que coincidan con tu perfil. ¿Te gustaría ajustar tu presupuesto o preferencias?

Lógica

Filtra por presupuesto, segmento, ubicación, transmisión y descuento si aplica.
Recomienda máximo 3 opciones, ordenadas por mejor ajuste al presupuesto y menor kilometraje.

Si aplica descuento de empleado:

Precio con descuento = Precio × 0.92 (redondeado)

Mostrar precio original y precio con descuento.

URLs

En cada vehículo recomendado debes mostrar exactamente el valor del campo "URL" del inventario.

No modifiques el enlace.

No lo acortes.

No agregues texto adicional.

No menciones limitaciones técnicas.

Formato de salida obligatorio

Marca Modelo Año

Precio: $XXX,XXX MXN

(Si aplica) Precio con descuento empleado: $XXX,XXX MXN

Ubicación: Ciudad, Estado

Kilometraje: XX,XXX km

Transmisión: Manual / Automática

Motivo recomendado: breve razón personalizada

Imagen: URL_DEL_JSON

No agregues texto adicional fuera de este formato.`,
        use_inventory: true,
      },
    },
  },
  {
    id: 'node-specialist-citas',
    type: 'specialist',
    position: { x: 950, y: 650 },
    data: {
      id: 'node-specialist-citas',
      type: 'specialist',
      label: 'Especialista Citas',
      subtitle: 'Agendamiento y disponibilidad',
      config: {
        agent_role: 'specialist_citas',
        system_prompt:
          'Eres el Especialista de Citas de AutoMóvil Premium. Con los datos del cliente (nombre, fecha, hora, motivo, vehículo de interés), verifica la disponibilidad en la agenda y confirma la cita. Si el horario solicitado no está disponible, sugiere la alternativa más cercana. Muestra un resumen de la cita confirmada con: nombre, fecha, hora local (Guatemala, UTC-6), motivo y vehículo de interés. Cierra con un mensaje cálido.',
        use_agenda: true,
      },
    },
  },
  {
    id: 'node-specialist-general',
    type: 'specialist',
    position: { x: 950, y: 880 },
    data: {
      id: 'node-specialist-general',
      type: 'specialist',
      label: 'Especialista Consultas',
      subtitle: 'FAQs personalizadas',
      config: {
        agent_role: 'specialist_general',
        system_prompt:
          'Eres el Especialista de Consultas de AutoMóvil Premium. Responde preguntas sobre horarios, ubicación, proceso de compra, financiamiento y garantías usando las FAQs. PERSONALIZA la respuesta según el perfil del cliente:\n- Cliente nuevo + asalariado joven (<30 años): enfatiza financiamiento accesible, cuotas bajas, sin historial crediticio requerido.\n- Cliente existente: destaca beneficios de lealtad, mantenimiento preferencial.\n- Independiente: menciona opciones de comprobantes de ingresos alternativos.\nNo des la misma respuesta genérica a todos — adapta el tono y contenido al perfil.',
        use_faqs: true,
      },
    },
  },
  {
    id: 'node-generic',
    type: 'generic',
    position: { x: 950, y: 1100 },
    data: {
      id: 'node-generic',
      type: 'generic',
      label: 'Agente Genérico',
      subtitle: 'Saludos y fuera de scope',
      config: {
        agent_role: 'generic',
        system_prompt:
          'Eres un asistente amigable de AutoMóvil Premium. Maneja saludos, despedidas y preguntas generales. Si el tema no es de la concesionaria, redirige amablemente al usuario hacia los servicios que sí ofreces: catálogo de vehículos, agendamiento de citas y consultas generales sobre la concesionaria.',
        use_faqs: true,
      },
    },
  },
  {
    id: 'node-output',
    type: 'output',
    position: { x: 1280, y: 640 },
    data: {
      id: 'node-output',
      type: 'output',
      label: 'Respuesta al Cliente',
      subtitle: 'Canal Web',
      config: {},
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  // Flujo principal
  { id: 'e-start-memory', source: 'node-start', target: 'node-memory', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-telegram-memory', source: 'node-telegram', target: 'node-memory', type: 'smoothstep', style: { stroke: '#0ea5e9', strokeWidth: 2 } },
  { id: 'e-memory-orch', source: 'node-memory', target: 'node-orchestrator', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },

  // Orquestador → agentes (líneas punteadas = decisión condicional)
  { id: 'e-orch-validator', source: 'node-orchestrator', target: 'node-validator', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-catalogo', source: 'node-orchestrator', target: 'node-specialist-catalogo', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-citas', source: 'node-orchestrator', target: 'node-specialist-citas', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-consultas', source: 'node-orchestrator', target: 'node-specialist-general', type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-generic', source: 'node-orchestrator', target: 'node-generic', type: 'smoothstep', style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5 3' } },

  // Validador → especialistas (datos completos)
  { id: 'e-validator-catalogo', source: 'node-validator', target: 'node-specialist-catalogo', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e-validator-citas', source: 'node-validator', target: 'node-specialist-citas', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e-validator-general', source: 'node-validator', target: 'node-specialist-general', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 } },

  // Especialistas → output
  { id: 'e-catalogo-output', source: 'node-specialist-catalogo', target: 'node-output', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-citas-output', source: 'node-specialist-citas', target: 'node-output', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-consultas-output', source: 'node-specialist-general', target: 'node-output', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-generic-output', source: 'node-generic', target: 'node-output', type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
];

// ─── Store interface ───────────────────────────────────────────────────────────
interface WorkflowStore {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  meta: WorkflowMeta;

  // Selection (for properties panel)
  selectedNodeId: string | null;

  // Validation
  invalidNodeId: string | null;

  // Pipeline debug state (populated by orchestrator SSE event)
  pipelineState: PipelineState | null;

  // Chat / playground
  isPlaygroundVisible: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  abortController: AbortController | null;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Node mutations
  addNode: (node: Node<WorkflowNodeData>) => void;
  updateNodeConfig: (id: string, config: Partial<WorkflowNodeData['config']>) => void;
  updateNodeMeta: (id: string, meta: { label?: string; subtitle?: string }) => void;

  // Selection
  setSelectedNode: (id: string | null) => void;

  // Validation
  setInvalidNodeId: (id: string | null) => void;

  // Pipeline
  setPipelineState: (state: PipelineState | null) => void;

  // Chat mutations
  addMessage: (message: ChatMessage) => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  setIsPlaygroundVisible: (value: boolean) => void;
  setIsStreaming: (value: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  resetMessages: () => void;

  // Generation
  isGenerating: boolean;
  generateMockWorkflow: () => void;

  // Import/Export
  setWorkflow: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
}

// ─── Store implementation ──────────────────────────────────────────────────────
export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: INITIAL_NODES.slice(0, 1), // Start only with the first node
  edges: [],
  meta: {
    name: 'Concesionaria AutoMóvil Premium',
    status: 'active',
    lastEdited: 'hace 2 min',
  },
  selectedNodeId: null,
  invalidNodeId: null,
  pipelineState: null,
  isPlaygroundVisible: false,
  messages: [],
  isStreaming: false,
  abortController: null,
  isGenerating: false,

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as Node<WorkflowNodeData>[] })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
        state.edges
      ),
    })),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  updateNodeConfig: (id, config) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n
      ),
    })),

  updateNodeMeta: (id, { label, subtitle }) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? {
            ...n,
            data: {
              ...n.data,
              ...(label !== undefined && { label }),
              ...(subtitle !== undefined && { subtitle }),
            },
          }
          : n
      ),
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setInvalidNodeId: (id) => set({ invalidNodeId: id }),

  setPipelineState: (pipelineState) => set({ pipelineState }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastAssistantMessage: (chunk) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages };
    }),

  setIsPlaygroundVisible: (value) => set({ isPlaygroundVisible: value }),

  setIsStreaming: (value) => set({ isStreaming: value }),

  setAbortController: (controller) => set({ abortController: controller }),

  resetMessages: () => {
    get().abortController?.abort();
    set({ messages: [], pipelineState: null, isStreaming: false, abortController: null });
  },

  generateMockWorkflow: () => {
    if (get().isGenerating) return;

    set({ isGenerating: true, nodes: [], edges: [] });

    let nodeIndex = 0;
    const addNextNode = () => {
      if (nodeIndex < INITIAL_NODES.length) {
        set((state) => ({ nodes: [...state.nodes, INITIAL_NODES[nodeIndex]] }));
        nodeIndex++;
        setTimeout(addNextNode, 500); // 500ms delay between nodes
      } else {
        // Once all nodes are added, add edges progressively
        let edgeIndex = 0;
        const addNextEdge = () => {
          if (edgeIndex < INITIAL_EDGES.length) {
            set((state) => ({ edges: [...state.edges, INITIAL_EDGES[edgeIndex]] }));
            edgeIndex++;
            setTimeout(addNextEdge, 200); // 200ms delay between edges
          } else {
            set({ isGenerating: false }); // Complete
          }
        };
        setTimeout(addNextEdge, 500);
      }
    };

    setTimeout(addNextNode, 500);
  },

  setWorkflow: (nodes, edges) => set({ nodes, edges }),
}));

// ─── Dev helper: expose store on window for browser console inspection ────────
// Usage in DevTools console:
//   $store()              → full state snapshot
//   $store().messages     → conversation history
//   $store().pipelineState → last orchestrator decision
//   $store().pipelineState?.extracted_data → collected client data
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>)['$store'] = () =>
    useWorkflowStore.getState();
}
