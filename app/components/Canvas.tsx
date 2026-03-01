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

// Register all node types — all share the same custom component
const nodeTypes: NodeTypes = {
  start: WorkflowNodeComponent,
  memory: WorkflowNodeComponent,
  orchestrator: WorkflowNodeComponent,
  validator: WorkflowNodeComponent,
  specialist: WorkflowNodeComponent,
  generic: WorkflowNodeComponent,
  tool: WorkflowNodeComponent,
  output: WorkflowNodeComponent,
  telegram: WorkflowNodeComponent,
};

function FlowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, meta,
    setSelectedNode,
    isGenerating, generateMockWorkflow,
  } = useWorkflowStore();
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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <main
      ref={reactFlowWrapper}
      className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#101422]"
      style={{ height: '100%' }}
    >
      {/* Floating workflow info */}
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight drop-shadow">
            {meta.name}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <span className="inline-block size-2 rounded-full bg-green-500" />
            <span className="capitalize">{meta.status}</span>
            <span className="mx-1">•</span>
            <span>Editado {meta.lastEdited}</span>
          </div>
        </div>
      </div>

      {/* Generation Trigger Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={generateMockWorkflow}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 ${isGenerating
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-[#2559f4] hover:bg-blue-600 text-white shadow-blue-500/25 cursor-pointer'
            }`}
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              Generando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">magic_button</span>
              Generar Nodos
            </>
          )}
        </button>
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
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#3b4154', strokeWidth: 2 },
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#3b4154" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </main>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
