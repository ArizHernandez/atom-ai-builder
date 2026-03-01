'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
// NodeProps without generics gives data: Record<string, unknown> — we cast below
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '@/app/types/workflow';

// Visual config per node type
const NODE_VISUAL_CONFIG = {
  start: {
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    iconName: 'play_arrow',
  },
  llm: {
    gradientFrom: 'from-[#2559f4]',
    gradientTo: 'to-purple-500',
    iconBg: 'bg-[#2559f4]/10',
    iconColor: 'text-[#2559f4]',
    iconName: 'neurology',
  },
  specialist: {
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    iconName: 'support_agent',
  },
  output: {
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    iconName: 'send',
  },
} as const;

// Shared handle base styles (use ! to override React Flow inline styles)
const HANDLE_BASE = '!w-3 !h-3 !border-2 !border-[#101422] !rounded-full';

// Inner content per node type
function NodeBody({ data }: { data: WorkflowNodeData }) {
  if (data.type === 'start') {
    return (
      <div className="bg-slate-50 dark:bg-[#101422] rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 mb-2 mt-2">
        POST /api/v1/support
      </div>
    );
  }

  if (data.type === 'llm') {
    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Model</span>
          <span className="text-slate-200">GPT-4o</span>
        </div>
        <div className="h-1 w-full bg-slate-200 dark:bg-[#282c39] rounded-full overflow-hidden">
          <div className="h-full bg-[#2559f4] w-2/3" />
        </div>
        {data.config.system_prompt && (
          <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">
            {data.config.system_prompt}
          </p>
        )}
      </div>
    );
  }

  if (data.type === 'specialist') {
    return (
      <p className="text-xs text-slate-400 leading-relaxed mt-2">
        {data.config.description || 'No description set.'}
      </p>
    );
  }

  if (data.type === 'output') {
    return (
      <p className="text-xs text-slate-400 leading-relaxed mt-2">
        Sends response to configured channel.
      </p>
    );
  }

  return null;
}

export function WorkflowNodeComponent({ data: rawData, selected }: NodeProps) {
  // React Flow passes data as Record<string, unknown> — cast to our concrete type
  const data = rawData as WorkflowNodeData;
  const visual = NODE_VISUAL_CONFIG[data.type] ?? NODE_VISUAL_CONFIG.start;

  const borderClass = selected
    ? 'border-[#2559f4] ring-2 ring-[#2559f4]/40'
    : data.type === 'llm'
    ? 'border-[#2559f4] ring-2 ring-[#2559f4]/20'
    : 'border-slate-200 dark:border-[#282c39]';

  const shadowClass =
    data.type === 'llm' ? 'shadow-2xl shadow-[#2559f4]/10' : 'shadow-xl';

  return (
    <div
      className={`w-[280px] bg-white dark:bg-[#1b1e27] rounded-xl border ${borderClass} ${shadowClass} hover:border-[#2559f4]/50 transition-colors group`}
    >
      {/* Gradient accent bar */}
      <div
        className={`bg-gradient-to-r ${visual.gradientFrom} ${visual.gradientTo} h-1.5 w-full rounded-t-xl`}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`size-8 rounded-lg ${visual.iconBg} flex items-center justify-center ${visual.iconColor}`}
            >
              <span className="material-symbols-outlined text-[20px]">{visual.iconName}</span>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white text-sm font-bold">{data.label}</h3>
              <p className="text-slate-500 text-xs">{data.subtitle}</p>
            </div>
          </div>

          {data.type === 'llm' && (
            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">
              Active
            </span>
          )}
        </div>

        <NodeBody data={data} />
      </div>

      {/* React Flow Handles — positioned by type */}
      {data.type === 'start' && (
        <Handle
          type="source"
          position={Position.Right}
          className={`${HANDLE_BASE} !bg-blue-500`}
        />
      )}

      {data.type === 'llm' && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className={`${HANDLE_BASE} !bg-slate-400`}
          />
          <Handle
            id="right"
            type="source"
            position={Position.Right}
            className={`${HANDLE_BASE} !bg-[#2559f4]`}
          />
          <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            className={`${HANDLE_BASE} !bg-purple-500`}
          />
        </>
      )}

      {data.type === 'specialist' && (
        <Handle
          type="target"
          position={Position.Top}
          className={`${HANDLE_BASE} !bg-slate-400`}
        />
      )}

      {data.type === 'output' && (
        <Handle
          type="target"
          position={Position.Left}
          className={`${HANDLE_BASE} !bg-slate-400`}
        />
      )}
    </div>
  );
}

export default WorkflowNodeComponent;
