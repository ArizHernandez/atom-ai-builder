'use client';

import React, { useState } from 'react';
import type { NodeType } from '@/app/types/workflow';

type DraggableNode = {
  type: NodeType;
  label: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  category: 'Logic & Flow' | 'Agents' | 'Integrations';
  highlighted?: boolean;
};

const DRAGGABLE_NODES: DraggableNode[] = [
  {
    type: 'start',
    label: 'Start Trigger',
    subtitle: 'Incoming Webhook',
    icon: 'play_arrow',
    iconColor: 'text-blue-500',
    category: 'Logic & Flow',
  },
  {
    type: 'llm',
    label: 'LLM Processor',
    subtitle: 'GPT-4o',
    icon: 'neurology',
    iconColor: 'text-[#2559f4]',
    category: 'Logic & Flow',
    highlighted: true,
  },
  {
    type: 'llm',
    label: 'Orchestrator',
    subtitle: 'Router Agent',
    icon: 'schema',
    iconColor: 'text-[#2559f4]',
    category: 'Logic & Flow',
  },
  {
    type: 'specialist',
    label: 'Specialist Agent',
    subtitle: 'Custom Agent',
    icon: 'support_agent',
    iconColor: 'text-purple-500',
    category: 'Agents',
  },
  {
    type: 'specialist',
    label: 'Validator',
    subtitle: 'Data Check',
    icon: 'fact_check',
    iconColor: 'text-teal-500',
    category: 'Agents',
  },
  {
    type: 'output',
    label: 'Response Output',
    subtitle: 'Webhook / Slack',
    icon: 'send',
    iconColor: 'text-emerald-500',
    category: 'Integrations',
  },
  {
    type: 'start',
    label: 'Webhook',
    subtitle: 'HTTP Trigger',
    icon: 'webhook',
    iconColor: 'text-green-500',
    category: 'Integrations',
  },
];

function onDragStart(
  event: React.DragEvent<HTMLDivElement>,
  node: DraggableNode
) {
  event.dataTransfer.setData('application/reactflow-nodetype', node.type);
  event.dataTransfer.setData('application/reactflow-nodelabel', node.label);
  event.dataTransfer.setData('application/reactflow-nodesubtitle', node.subtitle);
  event.dataTransfer.effectAllowed = 'move';
}

const CATEGORIES: DraggableNode['category'][] = ['Logic & Flow', 'Agents', 'Integrations'];

export default function SidebarLeft() {
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filtered = DRAGGABLE_NODES.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex z-10 shrink-0 h-full">
      <aside
        className={`flex flex-col border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1b1e27] transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-64 border-r' : 'w-0 border-r-0'
          }`}
      >
        <div className="w-64 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-[#282c39]">
            <h1 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-1">
              Node Library
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Drag to canvas</p>
            <div className="mt-3 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                className="w-full bg-slate-50 dark:bg-[#101422] border-none rounded text-xs py-2 pl-8 pr-3 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-1 focus:ring-[#2559f4] outline-none"
                placeholder="Search nodes..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

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
                No nodes found for &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-[#282c39] bg-slate-50 dark:bg-[#101422]/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>v2.4.0</span>
              <a className="hover:text-[#2559f4] transition-colors" href="#">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </aside>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-6 -right-3 z-50 flex items-center justify-center size-6 bg-white dark:bg-[#1b1e27] border border-slate-200 dark:border-[#282c39] rounded-full shadow-sm text-slate-500 hover:text-[#2559f4] transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">
          {isExpanded ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>
    </div>
  );
}
