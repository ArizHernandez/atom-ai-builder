'use client';

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { NodeTypes, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/app/store/workflowStore';
import { WorkflowNodeComponent } from './WorkflowNode';
import type { WorkflowNodeData, NodeType } from '@/app/types/workflow';

// Register all node types once outside the component to avoid re-renders.
// Cast to NodeTypes to satisfy React Flow's generic — data is cast inside WorkflowNodeComponent.
const nodeTypes: NodeTypes = {
  start: WorkflowNodeComponent,
  llm: WorkflowNodeComponent,
  specialist: WorkflowNodeComponent,
  output: WorkflowNodeComponent,
};

// Inner canvas — must be inside ReactFlowProvider to use useReactFlow()
function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, meta } =
    useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow-nodetype') as NodeType;
      const nodeLabel = event.dataTransfer.getData('application/reactflow-nodelabel');
      const nodeSubtitle = event.dataTransfer.getData('application/reactflow-nodesubtitle');

      if (!nodeType) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const newNodeId = `node-${nodeType}-${Date.now()}`;
      const newNode: Node<WorkflowNodeData> = {
        id: newNodeId,
        type: nodeType,
        position,
        data: {
          id: newNodeId,
          type: nodeType,
          label: nodeLabel || nodeType,
          subtitle: nodeSubtitle || '',
          config: {},
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <main
      ref={reactFlowWrapper}
      className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#101422]"
      style={{ height: '100%' }}
    >
      {/* Floating workflow info overlay */}
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight drop-shadow">
            {meta.name}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <span className="inline-block size-2 rounded-full bg-green-500" />
            <span className="capitalize">{meta.status}</span>
            <span className="mx-1">•</span>
            <span>Last edited {meta.lastEdited}</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#3b4154', strokeWidth: 2 },
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Dot grid replicating the original canvas-grid CSS */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#3b4154"
        />
        {/* Built-in zoom + fit controls */}
        <Controls showInteractive={false} />
      </ReactFlow>
    </main>
  );
}

// Exported default — wraps with ReactFlowProvider scoped to this canvas
export default function Canvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
