'use client';

import React, { useState } from 'react';
import type { NodeType } from '@/app/types/workflow';

type DraggableNode = {
  id?: string;
  type: NodeType;
  label: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  category: 'Core Flow' | 'Agentes' | 'Datos & Memoria';
  highlighted?: boolean;
};

const DRAGGABLE_NODES: DraggableNode[] = [
  // ── Core Flow ──────────────────────────────────
  {
    type: 'start',
    label: 'Start Trigger',
    subtitle: 'Mensaje entrante',
    icon: 'input',
    iconColor: 'text-blue-500',
    category: 'Core Flow',
  },
  {
    type: 'telegram',
    label: 'Telegram Bot',
    subtitle: 'Canal de mensajería',
    icon: 'send',
    iconColor: 'text-sky-500',
    category: 'Core Flow',
    highlighted: true,
  },
  {
    type: 'output',
    label: 'Response Output',
    subtitle: 'Mensaje saliente',
    icon: 'send',
    iconColor: 'text-green-500',
    category: 'Core Flow',
  },

  // ── Agentes ────────────────────────────────────
  {
    type: 'orchestrator',
    label: 'Agente Orquestador',
    subtitle: 'Router de intenciones',
    icon: 'target',
    iconColor: 'text-[#2559f4]',
    category: 'Agentes',
    highlighted: true,
  },
  {
    type: 'validator',
    label: 'Agente Validador',
    subtitle: 'Recopila datos',
    icon: 'fact_check',
    iconColor: 'text-amber-500',
    category: 'Agentes',
  },
  {
    type: 'specialist',
    label: 'Agente Especialista',
    subtitle: 'Resuelve con RAG',
    icon: 'support_agent',
    iconColor: 'text-purple-500',
    category: 'Agentes',
  },
  {
    type: 'generic',
    label: 'Agente Genérico',
    subtitle: 'Saludos / fuera de scope',
    icon: 'forum',
    iconColor: 'text-slate-400',
    category: 'Agentes',
  },

  // ── Datos & Memoria ────────────────────────────
  {
    type: 'memory',
    label: 'Nodo de Memoria',
    subtitle: 'Contexto de sesión',
    icon: 'memory',
    iconColor: 'text-violet-500',
    category: 'Datos & Memoria',
  },
  {
    type: 'tool',
    label: 'Tool / JSON',
    subtitle: 'Fuente de datos estática',
    icon: 'dataset',
    iconColor: 'text-emerald-500',
    category: 'Datos & Memoria',
  },
];

function onDragStart(event: React.DragEvent<HTMLDivElement>, node: DraggableNode) {
  event.dataTransfer.setData('application/reactflow-nodetype', node.type);
  event.dataTransfer.setData('application/reactflow-nodelabel', node.label);
  event.dataTransfer.setData('application/reactflow-nodesubtitle', node.subtitle);
  event.dataTransfer.effectAllowed = 'move';
}

const CATEGORIES: DraggableNode['category'][] = ['Core Flow', 'Agentes', 'Datos & Memoria'];

export default function SidebarLeft({ initialNodes = [] }: { initialNodes: DraggableNode[] }) {
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filtered = initialNodes.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  if (!isExpanded) {
    return (
      <aside className="w-12 flex flex-col items-center py-4 border-r border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-10 shrink-0">
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-[#282c39] rounded-lg text-slate-500 hover:text-[#2559f4] transition-colors"
          title="Expandir"
        >
          <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_right</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] z-10 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#282c39]">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider">
            Node Library
          </h1>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 -mt-1 -mr-1 hover:bg-slate-100 dark:hover:bg-[#282c39] rounded text-slate-500 hover:text-[#2559f4] transition-colors"
            title="Colapsar"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
          </button>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs">Arrastra al canvas</p>
        <div className="mt-3 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            className="w-full bg-slate-50 dark:bg-[#101422] border-none rounded text-xs py-2 pl-8 pr-3 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-1 focus:ring-[#2559f4] outline-none"
            placeholder="Buscar nodos..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {CATEGORIES.map((category, ci) => {
          const nodes = filtered.filter((n) => n.category === category);
          if (nodes.length === 0) return null;
          return (
            <div
              key={category}
              className={`px-2 py-2 ${ci > 0 ? 'border-t border-slate-100 dark:border-[#282c39]' : ''}`}
            >
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">
                {category}
              </p>
              <div className="space-y-1">
                {nodes.map((node) => (
                  <div
                    key={node.label}
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing group transition-colors select-none ${node.highlighted
                      ? 'bg-[#2559f4]/10 dark:bg-[#2559f4]/20 border border-[#2559f4]/20'
                      : 'hover:bg-slate-100 dark:hover:bg-[#282c39]'
                      }`}
                  >
                    <span
                      className={`material-symbols-outlined ${node.iconColor} group-hover:scale-110 transition-transform`}
                    >
                      {node.icon}
                    </span>
                    <div>
                      <span className="text-slate-700 dark:text-slate-200 text-sm font-medium block">
                        {node.label}
                      </span>
                      <span className="text-slate-400 text-[10px]">{node.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-xs">
            No se encontró &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-[#282c39] bg-slate-50 dark:bg-[#101422]/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>v2.5.0</span>
          <a className="hover:text-[#2559f4] transition-colors" href="#">
            Documentación
          </a>
        </div>
      </div>
    </aside>
  );
}
