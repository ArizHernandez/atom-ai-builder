// Shared TypeScript types — NO 'use client' (used by both client components and server API routes)

export type NodeType = 'start' | 'llm' | 'specialist' | 'output';

export interface NodeConfig {
  system_prompt?: string; // for llm nodes
  description?: string;   // for specialist nodes
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
