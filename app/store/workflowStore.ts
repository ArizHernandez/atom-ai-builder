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
import type { WorkflowNodeData, WorkflowMeta, ChatMessage } from '@/app/types/workflow';

// Initial demo flow replicating the original Canvas.tsx static demo
const INITIAL_NODES: Node<WorkflowNodeData>[] = [
  {
    id: 'node-start',
    type: 'start',
    position: { x: 100, y: 200 },
    data: {
      id: 'node-start',
      type: 'start',
      label: 'Start Trigger',
      subtitle: 'Incoming Webhook',
      config: {},
    },
  },
  {
    id: 'node-llm-1',
    type: 'llm',
    position: { x: 480, y: 180 },
    data: {
      id: 'node-llm-1',
      type: 'llm',
      label: 'Intent Analysis',
      subtitle: 'LLM Processor',
      config: {
        system_prompt:
          'You are a customer support intent classifier. Analyze the user message and determine whether the issue is related to billing, technical support, or a general inquiry. Route accordingly.',
      },
    },
  },
  {
    id: 'node-specialist-1',
    type: 'specialist',
    position: { x: 480, y: 460 },
    data: {
      id: 'node-specialist-1',
      type: 'specialist',
      label: 'Billing Agent',
      subtitle: 'Specialist',
      config: { description: 'Handles refunds and invoice queries.' },
    },
  },
  {
    id: 'node-output-1',
    type: 'output',
    position: { x: 880, y: 200 },
    data: {
      id: 'node-output-1',
      type: 'output',
      label: 'Response',
      subtitle: 'Slack Notification',
      config: {},
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e-start-llm',
    source: 'node-start',
    target: 'node-llm-1',
    type: 'smoothstep',
    style: { stroke: '#3b4154', strokeWidth: 2 },
  },
  {
    id: 'e-llm-specialist',
    source: 'node-llm-1',
    sourceHandle: 'bottom',
    target: 'node-specialist-1',
    type: 'smoothstep',
    style: { stroke: '#3b4154', strokeWidth: 2 },
  },
  {
    id: 'e-llm-output',
    source: 'node-llm-1',
    sourceHandle: 'right',
    target: 'node-output-1',
    type: 'smoothstep',
    style: { stroke: '#3b4154', strokeWidth: 2 },
  },
];

interface WorkflowStore {
  // React Flow state
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];

  // Workflow metadata
  meta: WorkflowMeta;

  // Chat/playground state
  messages: ChatMessage[];
  isStreaming: boolean;

  // React Flow controlled-flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Node mutations
  addNode: (node: Node<WorkflowNodeData>) => void;
  updateNodeConfig: (id: string, config: Partial<WorkflowNodeData['config']>) => void;

  // Chat mutations
  addMessage: (message: ChatMessage) => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  setIsStreaming: (value: boolean) => void;
  resetMessages: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  meta: {
    name: 'Customer Support Workflow',
    status: 'active',
    lastEdited: '2m ago',
  },
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

  resetMessages: () => set({ messages: [] }),
}));
