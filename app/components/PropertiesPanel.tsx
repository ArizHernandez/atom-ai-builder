'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/app/store/workflowStore';
import type { NodeType, RagFile } from '@/app/types/workflow';
import { Button } from '@/app/components/ui/Button';

// ─── Static maps ──────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<NodeType, string> = {
  start: 'Start Trigger',
  memory: 'Nodo de Memoria',
  orchestrator: 'Agente Orquestador',
  validator: 'Agente Validador',
  specialist: 'Agente Especialista',
  generic: 'Agente Genérico',
  tool: 'Tool / JSON',
  output: 'Output',
  telegram: 'Telegram',
};

const TYPE_COLOR: Record<NodeType, string> = {
  start: 'text-blue-500   bg-blue-500/10   border-blue-500/20',
  memory: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  orchestrator: 'text-[#2559f4]  bg-[#2559f4]/10  border-[#2559f4]/20',
  validator: 'text-amber-500  bg-amber-500/10  border-amber-500/20',
  specialist: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  generic: 'text-slate-400  bg-slate-500/10  border-slate-500/20',
  tool: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  output: 'text-green-500  bg-green-500/10  border-green-500/20',
  telegram: 'text-[#0088cc]  bg-[#0088cc]/10  border-[#0088cc]/20',
};

const TYPE_ICON: Record<NodeType, string> = {
  start: 'input',
  memory: 'memory',
  orchestrator: 'target',
  validator: 'fact_check',
  specialist: 'support_agent',
  generic: 'forum',
  tool: 'dataset',
  output: 'send',
  telegram: 'send',
};

// ─── Reusable field styles ────────────────────────────────────────────────────
const INPUT_CLS =
  'w-full bg-slate-50 dark:bg-[#101422] border border-slate-200 dark:border-[#282c39] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2559f4] focus:border-transparent resize-none';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{children}</label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
      {children}
    </p>
  );
}

// ─── RAG toggle ───────────────────────────────────────────────────────────────
function RagToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${checked
        ? 'bg-[#2559f4]/10 border-[#2559f4]/30'
        : 'bg-slate-50 dark:bg-[#101422] border-slate-200 dark:border-[#282c39] hover:border-[#2559f4]/30'
        }`}
    >
      <div
        className={`mt-0.5 size-4 rounded flex items-center justify-center shrink-0 border transition-colors ${checked ? 'bg-[#2559f4] border-[#2559f4]' : 'border-slate-300 dark:border-slate-600'
          }`}
      >
        {checked && (
          <span className="material-symbols-outlined text-white text-[12px]">check</span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PropertiesPanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeConfig, updateNodeMeta } =
    useWorkflowStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  // Local form state
  const [label, setLabel] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [useInventory, setUseInventory] = useState(false);
  const [useFaqs, setUseFaqs] = useState(false);
  const [useAgenda, setUseAgenda] = useState(false);
  const [toolSource, setToolSource] = useState<'inventory' | 'faqs' | 'agenda'>('inventory');
  const [hasRagAddon, setHasRagAddon] = useState(false);
  const [ragFiles, setRagFiles] = useState<RagFile[]>([]);
  const [saved, setSaved] = useState(false);

  // Sync form when selected node changes
  useEffect(() => {
    if (!node) return;
    setLabel(node.data.label);
    setSubtitle(node.data.subtitle);
    setSystemPrompt(node.data.config.system_prompt ?? '');
    setDescription(node.data.config.description ?? '');
    setUseInventory(node.data.config.use_inventory ?? false);
    setUseFaqs(node.data.config.use_faqs ?? false);
    setUseAgenda(node.data.config.use_agenda ?? false);
    setToolSource(node.data.config.tool_source ?? 'inventory');
    setHasRagAddon(node.data.config.has_rag_addon ?? false);
    setRagFiles(node.data.config.rag_files ?? []);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  if (!node) return null;

  const { type } = node.data;
  const hasPrompt = type === 'orchestrator' || type === 'specialist' || type === 'generic';
  const hasDescription = type === 'validator';
  const hasRag = type === 'specialist' || type === 'generic' || type === 'orchestrator';
  const isReadOnly = type === 'start' || type === 'output' || type === 'memory';

  const handleSave = () => {
    updateNodeMeta(node.id, { label, subtitle });
    updateNodeConfig(node.id, {
      ...(hasPrompt && { system_prompt: systemPrompt }),
      ...(hasDescription && { description }),
      ...(hasRag && { use_inventory: useInventory, use_faqs: useFaqs, use_agenda: useAgenda, has_rag_addon: hasRagAddon, rag_files: ragFiles }),
      ...(type === 'tool' && { tool_source: toolSource }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-[#282c39] shrink-0">
        <Button
          onClick={() => setSelectedNode(null)}
          variant="ghost"
          size="icon"
          icon="arrow_back"
          title="Volver al Playground"
          className="p-1.5"
        />
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-sm">Propiedades del Nodo</h2>
          <p className="text-[10px] text-slate-400 font-mono">{node.id}</p>
        </div>
      </div>

      {/* ── Type badge ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#282c39] shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${TYPE_COLOR[type]}`}
        >
          <span className="material-symbols-outlined text-[14px]">{TYPE_ICON[type]}</span>
          {TYPE_LABEL[type]}
        </span>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Identity */}
        <div>
          <SectionTitle>Identidad</SectionTitle>
          <div className="space-y-3">
            <div>
              <FieldLabel>Nombre del nodo</FieldLabel>
              <input
                className={INPUT_CLS}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nombre del nodo..."
              />
            </div>
            <div>
              <FieldLabel>Subtítulo</FieldLabel>
              <input
                className={INPUT_CLS}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtítulo o descripción corta..."
              />
            </div>
          </div>
        </div>

        {/* Read-only info nodes */}
        {isReadOnly && (
          <div className="p-3 bg-slate-50 dark:bg-[#101422] rounded-lg border border-slate-200 dark:border-[#282c39] text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {type === 'start' && 'Punto de entrada del flujo. Recibe el mensaje entrante del usuario.'}
            {type === 'memory' && 'Recupera y guarda el contexto de la conversación en memoria durante la sesión activa.'}
            {type === 'output' && 'Envía la respuesta final al canal configurado (Web, WhatsApp, Telegram, etc.).'}
          </div>
        )}

        {/* System Prompt */}
        {hasPrompt && (
          <div>
            <SectionTitle>System Prompt</SectionTitle>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#2559f4]">neurology</span>
              <FieldLabel>
                {type === 'orchestrator'
                  ? 'Instrucciones del orquestador (debe responder en JSON)'
                  : 'Instrucciones del agente'}
              </FieldLabel>
            </div>
            <textarea
              className={`${INPUT_CLS} leading-relaxed text-[12px] font-mono`}
              rows={type === 'orchestrator' ? 10 : 6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
            />
            {type === 'orchestrator' && (
              <p className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                El orquestador debe responder ÚNICAMENTE con JSON para que el pipeline funcione.
              </p>
            )}
          </div>
        )}

        {/* Validator description */}
        {hasDescription && (
          <div>
            <SectionTitle>Instrucciones de Validación</SectionTitle>
            <FieldLabel>¿Qué datos debe recopilar?</FieldLabel>
            <textarea
              className={`${INPUT_CLS} leading-relaxed`}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Recopila los datos necesarios del usuario..."
            />
          </div>
        )}

        {/* Tool source */}
        {type === 'tool' && (
          <div>
            <SectionTitle>Fuente de Datos</SectionTitle>
            <FieldLabel>JSON estático</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(['inventory', 'faqs', 'agenda'] as const).map((src) => {
                const labels = { inventory: '📦 Inventario', faqs: '📋 FAQs', agenda: '📅 Agenda' };
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setToolSource(src)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${toolSource === src
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-slate-50 dark:bg-[#101422] border-slate-200 dark:border-[#282c39] text-slate-500 hover:border-emerald-500/30'
                      }`}
                  >
                    {labels[src]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RAG toggles */}
        {hasRag && (
          <div>
            <SectionTitle>RAG — Datos para Contexto</SectionTitle>
            <div className="space-y-2">
              <RagToggle
                label="📦 Inyectar Inventario"
                description="Incluye el catálogo de vehículos en el contexto del agente"
                checked={useInventory}
                onChange={setUseInventory}
              />
              <RagToggle
                label="📋 Inyectar FAQs"
                description="Incluye las preguntas frecuentes de la concesionaria"
                checked={useFaqs}
                onChange={setUseFaqs}
              />
              <RagToggle
                label="📅 Inyectar Agenda"
                description="Incluye los horarios disponibles para citas y pruebas de manejo"
                checked={useAgenda}
                onChange={setUseAgenda}
              />
            </div>
          </div>
        )}

        {/* Add-ons */}
        {hasRag && (
          <div className="pt-2 border-t border-slate-200 dark:border-[#282c39]">
            <SectionTitle>Add-ons</SectionTitle>

            {!hasRagAddon ? (
              <Button
                onClick={() => setHasRagAddon(true)}
                variant="outline"
                icon="add_circle"
                fullWidth
                className="border-dashed text-slate-500 hover:text-[#2559f4] hover:bg-[#2559f4]/5"
              >
                Agregar RAG Knowledge Base
              </Button>
            ) : (
              <div className="p-3 bg-white dark:bg-[#1b1e27] border border-[#2559f4]/30 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-[#2559f4]/10 flex items-center justify-center text-[#2559f4]">
                      <span className="material-symbols-outlined text-[14px]">database</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">RAG Knowledge Base</span>
                  </div>
                  <Button
                    onClick={() => {
                      setHasRagAddon(false);
                      setRagFiles([]);
                    }}
                    variant="ghost"
                    size="icon"
                    icon="delete"
                    title="Eliminar Add-on"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  />
                </div>

                {ragFiles.length === 0 ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 dark:border-[#282c39] border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-[#101422] hover:bg-slate-100 dark:hover:bg-[#1b1e27] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-5 text-slate-500">
                      <span className="material-symbols-outlined text-[24px] mb-1">upload_file</span>
                      <p className="text-xs font-medium px-2 text-center">Subir JSON</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          try {
                            JSON.parse(content); // Validate JSON
                            setRagFiles([{
                              name: file.name,
                              size: file.size,
                              content: content
                            }]);
                          } catch (err) {
                            alert("El archivo no es un JSON válido.");
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    {ragFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#101422] rounded border border-slate-200 dark:border-[#282c39]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">description</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">{f.name}</span>
                          {f.size && <span className="text-[10px] text-slate-400 shrink-0">({Math.round(f.size / 1024)} KB)</span>}
                        </div>
                        <Button
                          onClick={() => setRagFiles(ragFiles.filter((_, k) => k !== idx))}
                          variant="ghost"
                          size="icon"
                          icon="close"
                          className="h-6 w-6 text-slate-400 hover:text-red-500 ml-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Save button ─────────────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="p-4 border-t border-slate-200 dark:border-[#282c39] shrink-0">
          <Button
            onClick={handleSave}
            variant={saved ? 'success' : 'primary'}
            icon={saved ? 'check_circle' : 'save'}
            fullWidth
          >
            {saved ? '¡Guardado!' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}
