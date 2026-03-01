'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData, NodeType } from '@/app/types/workflow';

// ─── Visual config per node type ──────────────────────────────────────────────
const NODE_VISUAL_CONFIG: Record<NodeType, {
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  iconColor: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
}> = {
  start: {
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-400',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    iconName: 'input',
  },
  memory: {
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-400',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    iconName: 'memory',
  },
  orchestrator: {
    gradientFrom: 'from-[#2559f4]',
    gradientTo: 'to-blue-400',
    iconBg: 'bg-[#2559f4]/10',
    iconColor: 'text-[#2559f4]',
    iconName: 'target',
    badge: 'Router',
    badgeColor: 'bg-[#2559f4]/10 text-[#2559f4] border-[#2559f4]/20',
  },
  validator: {
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-400',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    iconName: 'fact_check',
    badge: 'Gate',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  specialist: {
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-400',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    iconName: 'support_agent',
    badge: 'RAG',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  generic: {
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-gray-400',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-400',
    iconName: 'forum',
    badge: 'Fallback',
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  tool: {
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-400',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    iconName: 'dataset',
  },
  output: {
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-400',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
    iconName: 'send',
  },
};

const HANDLE_BASE = '!w-3 !h-3 !border-2 !border-[#101422] !rounded-full';

// ─── Node body content by type ────────────────────────────────────────────────
function NodeBody({ data }: { data: WorkflowNodeData }) {
  const { type, config } = data;

  if (type === 'start') {
    return (
      <div className="bg-slate-50 dark:bg-[#101422] rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 mt-2">
        POST /api/v1/chat
      </div>
    );
  }

  if (type === 'memory') {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="material-symbols-outlined text-[14px] text-violet-500">history</span>
        <span>Contexto en sesión activa</span>
      </div>
    );
  }

  if (type === 'orchestrator') {
    return (
      <div className="mt-2 space-y-1.5">
        <div className="flex gap-1 flex-wrap">
          {['catalogo', 'citas', 'consulta', 'generic'].map((intent) => (
            <span
              key={intent}
              className="text-[10px] px-1.5 py-0.5 bg-[#2559f4]/10 text-[#2559f4] rounded border border-[#2559f4]/20 font-medium"
            >
              {intent}
            </span>
          ))}
        </div>
        {config.system_prompt && (
          <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">
            {config.system_prompt.slice(0, 80)}…
          </p>
        )}
      </div>
    );
  }

  if (type === 'validator') {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
          {config.description || 'Recopila datos necesarios del usuario.'}
        </p>
        {config.validation_fields && config.validation_fields.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {config.validation_fields.map((f) => (
              <span
                key={f}
                className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded border border-amber-500/20"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'specialist') {
    return (
      <div className="mt-2 space-y-1.5">
        {config.system_prompt && (
          <p className="text-[10px] text-slate-500 italic leading-relaxed line-clamp-2">
            {config.system_prompt.slice(0, 90)}…
          </p>
        )}
        <div className="flex gap-1 flex-wrap">
          {config.use_inventory && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
              📦 Inventario
            </span>
          )}
          {config.use_agenda && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">
              📅 Agenda
            </span>
          )}
          {config.use_faqs && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-500 rounded border border-violet-500/20">
              📋 FAQs
            </span>
          )}
        </div>
      </div>
    );
  }

  if (type === 'generic') {
    return (
      <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
        {config.system_prompt?.slice(0, 90) || 'Maneja saludos y fuera de scope.'}
      </p>
    );
  }

  if (type === 'tool') {
    const src = config.tool_source ?? 'inventory';
    const labels: Record<string, string> = { inventory: '📦 Inventario', faqs: '📋 FAQs', agenda: '📅 Agenda' };
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
          {labels[src] ?? src}
        </span>
        <span className="text-[10px] text-slate-400">JSON estático</span>
      </div>
    );
  }

  if (type === 'output') {
    return (
      <p className="text-xs text-slate-400 leading-relaxed mt-2">
        Envía la respuesta al canal configurado.
      </p>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function WorkflowNodeComponent({ data: rawData, selected }: NodeProps) {
  const data = rawData as WorkflowNodeData;
  const visual = NODE_VISUAL_CONFIG[data.type] ?? NODE_VISUAL_CONFIG.start;

  const borderClass = selected
    ? 'border-[#2559f4] ring-2 ring-[#2559f4]/40'
    : data.type === 'orchestrator'
      ? 'border-[#2559f4]/40 ring-1 ring-[#2559f4]/20'
      : 'border-slate-200 dark:border-[#282c39]';

  const shadowClass =
    data.type === 'orchestrator' ? 'shadow-2xl shadow-[#2559f4]/10' : 'shadow-xl';

  return (
    <div
      className={`w-[260px] bg-white dark:bg-[#1b1e27] rounded-xl border ${borderClass} ${shadowClass} hover:border-[#2559f4]/50 transition-colors group`}
    >
      {/* Gradient accent bar */}
      <div className={`bg-gradient-to-r ${visual.gradientFrom} ${visual.gradientTo} h-1.5 w-full rounded-t-xl`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg ${visual.iconBg} flex items-center justify-center ${visual.iconColor} shrink-0`}>
              <span className="material-symbols-outlined text-[20px]">{visual.iconName}</span>
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">{data.label}</h3>
              <p className="text-slate-500 text-xs">{data.subtitle}</p>
            </div>
          </div>

          {visual.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${visual.badgeColor}`}>
              {visual.badge}
            </span>
          )}
        </div>

        <NodeBody data={data} />
      </div>

      {/* ── Handles by node type ─────────────────────────────────── */}
      {data.type === 'start' && (
        <Handle type="source" position={Position.Right} className={`${HANDLE_BASE} !bg-blue-500`} />
      )}

      {data.type === 'memory' && (
        <>
          <Handle type="target" position={Position.Left} className={`${HANDLE_BASE} !bg-slate-400`} />
          <Handle type="source" position={Position.Right} className={`${HANDLE_BASE} !bg-violet-500`} />
        </>
      )}

      {data.type === 'orchestrator' && (
        <>
          <Handle type="target" position={Position.Left} className={`${HANDLE_BASE} !bg-slate-400`} />
          <Handle type="source" position={Position.Right} className={`${HANDLE_BASE} !bg-[#2559f4]`} />
          <Handle id="bottom" type="source" position={Position.Bottom} className={`${HANDLE_BASE} !bg-[#2559f4]`} />
        </>
      )}

      {(data.type === 'validator' || data.type === 'specialist' || data.type === 'generic') && (
        <>
          <Handle type="target" position={Position.Left} className={`${HANDLE_BASE} !bg-slate-400`} />
          <Handle type="source" position={Position.Right} className={`${HANDLE_BASE} !bg-slate-400`} />
        </>
      )}

      {data.type === 'tool' && (
        <>
          <Handle type="target" position={Position.Top} className={`${HANDLE_BASE} !bg-emerald-500`} />
          <Handle type="source" position={Position.Bottom} className={`${HANDLE_BASE} !bg-emerald-500`} />
        </>
      )}

      {data.type === 'output' && (
        <Handle type="target" position={Position.Left} className={`${HANDLE_BASE} !bg-green-500`} />
      )}
    </div>
  );
}

export default WorkflowNodeComponent;
