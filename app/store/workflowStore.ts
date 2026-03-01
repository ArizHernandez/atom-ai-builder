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

// ─── Demo: Concesionaria AutoMóvil Premium ────────────────────────────────────
const INITIAL_NODES: Node<WorkflowNodeData>[] = [
  {
    id: 'node-start',
    type: 'start',
    position: { x: 60, y: 340 },
    data: {
      id: 'node-start',
      type: 'start',
      label: 'Canal Web',
      subtitle: 'Mensaje entrante',
      config: {},
    },
  },
  {
    id: 'node-memory',
    type: 'memory',
    position: { x: 340, y: 340 },
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
    position: { x: 630, y: 340 },
    data: {
      id: 'node-orchestrator',
      type: 'orchestrator',
      label: 'Agente Orquestador',
      subtitle: 'Router de intenciones',
      config: {
        agent_role: 'orchestrator',
        system_prompt:
          'Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con JSON:\n{\n  "intent": "catalogo | citas | consulta_general | out_of_scope",\n  "confidence": 0.0-1.0,\n  "next_agent": "validator | specialist | generic",\n  "requires_validation": true/false,\n  "extracted_data": { "cliente_tipo": null, "presupuesto": null, "preferencia": null, "nombre": null, "fecha_preferida": null },\n  "reasoning": "explicación breve"\n}',
      },
    },
  },
  {
    id: 'node-validator',
    type: 'validator',
    position: { x: 950, y: 140 },
    data: {
      id: 'node-validator',
      type: 'validator',
      label: 'Agente Validador',
      subtitle: 'Recopila datos del cliente',
      config: {
        agent_role: 'validator',
        description:
          'Recopila los datos necesarios del cliente de forma conversacional, uno a la vez:\n- Para catálogo: presupuesto, tipo de vehículo (SUV/Sedan/Pickup), ¿nuevo o usado?\n- Para citas: nombre, fecha, hora, vehículo de interés\n- Para consultas: ¿cliente nuevo o existente?, ¿asalariado o independiente?\nSi ya tienes todos los datos, confirma que la información está completa.',
        validation_fields: ['cliente_tipo', 'presupuesto', 'preferencia'],
      },
    },
  },
  {
    id: 'node-specialist-catalogo',
    type: 'specialist',
    position: { x: 950, y: 380 },
    data: {
      id: 'node-specialist-catalogo',
      type: 'specialist',
      label: 'Especialista Catálogo',
      subtitle: 'Vehículos y precios',
      config: {
        agent_role: 'specialist_catalogo',
        system_prompt:
          'Eres el Especialista de Catálogo. Filtra el inventario según el perfil del cliente (segmento: SUV/Sedán/Hatchback/Pickup, precio máximo, transmisión, tipo de combustible) y recomienda máximo 3 opciones. Para cada opción muestra: Marca Modelo Año, Precio en MXN, Ciudad/Estado, Kilometraje y una razón breve por qué se ajusta. Sé conciso y usa formato de lista.',
        use_inventory: true,
      },
    },
  },
  {
    id: 'node-specialist-citas',
    type: 'specialist',
    position: { x: 950, y: 600 },
    data: {
      id: 'node-specialist-citas',
      type: 'specialist',
      label: 'Especialista Citas',
      subtitle: 'Agendamiento y disponibilidad',
      config: {
        agent_role: 'specialist_citas',
        system_prompt:
          'Eres el Especialista de Citas. Ayuda al cliente a agendar una prueba de manejo o cita con asesor. Usa los horarios disponibles de la agenda. Confirma: nombre del cliente, fecha, hora (en hora local Guatemala UTC-6), vehículo de interés y motivo. Resume la cita antes de confirmar.',
        use_agenda: true,
      },
    },
  },
  {
    id: 'node-generic',
    type: 'generic',
    position: { x: 950, y: 820 },
    data: {
      id: 'node-generic',
      type: 'generic',
      label: 'Agente Genérico',
      subtitle: 'Saludos y fuera de scope',
      config: {
        agent_role: 'generic',
        system_prompt:
          'Eres un asistente amigable de AutoMóvil Premium. Maneja saludos, despedidas y preguntas generales. Si el tema no es de la concesionaria, redirige amablemente al usuario hacia los servicios que sí ofreces: catálogo de vehículos, citas y consultas.',
        use_faqs: true,
      },
    },
  },
  {
    id: 'node-output',
    type: 'output',
    position: { x: 1280, y: 490 },
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
  { id: 'e-start-memory',        source: 'node-start',              target: 'node-memory',               type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-memory-orch',         source: 'node-memory',             target: 'node-orchestrator',         type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-orch-validator',      source: 'node-orchestrator',       target: 'node-validator',            type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-catalogo',       source: 'node-orchestrator',       target: 'node-specialist-catalogo',  type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-citas',          source: 'node-orchestrator',       target: 'node-specialist-citas',     type: 'smoothstep', style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-orch-generic',        source: 'node-orchestrator',       target: 'node-generic',              type: 'smoothstep', style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5 3' } },
  { id: 'e-validator-catalogo',  source: 'node-validator',          target: 'node-specialist-catalogo',  type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e-catalogo-output',     source: 'node-specialist-catalogo',target: 'node-output',               type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-citas-output',        source: 'node-specialist-citas',   target: 'node-output',               type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
  { id: 'e-generic-output',      source: 'node-generic',            target: 'node-output',               type: 'smoothstep', style: { stroke: '#3b4154', strokeWidth: 2 } },
];

// ─── Store interface ───────────────────────────────────────────────────────────
interface WorkflowStore {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  meta: WorkflowMeta;

  // Selection (for properties panel)
  selectedNodeId: string | null;

  // Pipeline debug state (populated by orchestrator SSE event)
  pipelineState: PipelineState | null;

  // Chat / playground
  messages: ChatMessage[];
  isStreaming: boolean;

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

  // Pipeline
  setPipelineState: (state: PipelineState | null) => void;

  // Chat mutations
  addMessage: (message: ChatMessage) => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  setIsStreaming: (value: boolean) => void;
  resetMessages: () => void;
}

// ─── Store implementation ──────────────────────────────────────────────────────
export const useWorkflowStore = create<WorkflowStore>((set) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  meta: {
    name: 'Concesionaria AutoMóvil Premium',
    status: 'active',
    lastEdited: 'hace 2 min',
  },
  selectedNodeId: null,
  pipelineState: null,
  messages: [],
  isStreaming: false,

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

  setIsStreaming: (value) => set({ isStreaming: value }),

  resetMessages: () => set({ messages: [], pipelineState: null }),
}));
