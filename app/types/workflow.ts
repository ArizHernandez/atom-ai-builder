// Shared TypeScript types — NO 'use client' (used by both client components and server API routes)

export type NodeType =
  | 'start'
  | 'memory'
  | 'orchestrator'
  | 'validator'
  | 'specialist'
  | 'generic'
  | 'tool'
  | 'output';

export interface NodeConfig {
  system_prompt?: string;   // for orchestrator / specialist / generic / validator
  description?: string;     // for validator / generic nodes
  use_inventory?: boolean;  // inject car inventory JSON (RAG)
  use_faqs?: boolean;       // inject FAQs JSON (RAG)
  use_agenda?: boolean;     // inject agenda/test-drive slots (RAG)
  agent_role?:              // routing hint for the API
    | 'orchestrator'
    | 'validator'
    | 'specialist_catalogo'
    | 'specialist_citas'
    | 'specialist_general'
    | 'generic';
  validation_fields?: string[]; // which fields the validator must collect
  tool_source?: 'inventory' | 'faqs' | 'agenda'; // for tool nodes
}

export interface WorkflowNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  label: string;
  subtitle: string;
  config: NodeConfig;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WorkflowMeta {
  name: string;
  status: 'active' | 'draft';
  lastEdited: string;
}

/** State emitted by the orchestrator after classifying user intent */
export interface PipelineState {
  intent?: string;           // 'catalogo' | 'citas' | 'consulta_general' | 'out_of_scope'
  confidence?: number;
  active_node?: string;      // label of the node currently handling the request
  next_agent?: string;       // 'validator' | 'specialist' | 'generic'
  requires_validation?: boolean;
  is_validation_complete?: boolean;
  extracted_data?: {
    cliente_tipo?: string | null;
    presupuesto?: number | null;
    preferencia?: string | null;
    nombre?: string | null;
    fecha_preferida?: string | null;
    hora_preferida?: string | null;
  };
  reasoning?: string;
}
