'use client';

import { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useWorkflowStore } from '../store/workflowStore';
import basicChatTemplate from '../data/basic-chat.json';
import supportTemplate from '../data/support.json';
import ecommerceTemplate from '../data/ecommerce.json';

interface ImportWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const templates = [
    { id: 'basic-chat', name: 'Basic Chatbot', description: 'A simple Telegram chatbot workflow', icon: 'smart_toy' },
    { id: 'support', name: 'Customer Support', description: 'Advanced support flow with custom logic', icon: 'support_agent' },
    { id: 'ecommerce', name: 'E-commerce', description: 'Store assistant and order tracking', icon: 'shopping_cart' },
    { id: 'blank', name: 'Blank Canvas', description: 'Start from scratch', icon: 'add_circle' },
];

export function ImportWorkflowModal({ isOpen, onClose }: ImportWorkflowModalProps) {
    const [activeTab, setActiveTab] = useState<'template' | 'upload'>('template');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setWorkflow } = useWorkflowStore();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (parsed.nodes && parsed.edges) {
                        setWorkflow(parsed.nodes, parsed.edges);
                        onClose();
                    } else {
                        alert('Invalid workflow file format');
                    }
                } catch (error) {
                    alert('Error reading file');
                }
            };
            reader.readAsText(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        try {
            if (templateId === 'blank') {
                setWorkflow([], []);
            } else if (templateId === 'basic-chat') {
                setWorkflow(basicChatTemplate.nodes as any, basicChatTemplate.edges as any);
            } else if (templateId === 'support') {
                setWorkflow(supportTemplate.nodes as any, supportTemplate.edges as any);
            } else if (templateId === 'ecommerce') {
                setWorkflow(ecommerceTemplate.nodes as any, ecommerceTemplate.edges as any);
            }
            onClose();
        } catch (error) {
            console.error('Error loading template', error);
            alert('Error loading template');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Workflow">
            <div className="flex space-x-1 border-b border-slate-200 dark:border-border-dark mb-6">
                <button
                    onClick={() => setActiveTab('template')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'template'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    Plantillas
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'upload'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    Subir JSON
                </button>
            </div>

            <div className="min-h-[250px]">
                {activeTab === 'template' ? (
                    <div className="grid grid-cols-2 gap-4">
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => handleTemplateSelect(t.id)}
                                className="border border-slate-200 dark:border-border-dark rounded-xl p-5 cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center text-center group"
                            >
                                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                                    <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                                        {t.icon}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{t.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] border-2 border-dashed border-slate-300 dark:border-border-dark rounded-xl p-8 hover:border-primary/50 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500">upload_file</span>
                        </div>
                        <div className="text-center max-w-sm">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-2">Upload Workflow File</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Sube un archivo JSON de flujo de trabajo previamente exportado desde Atom AI Builder.
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFileChange}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                icon="folder_open"
                            >
                                Explorar Archivos
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
