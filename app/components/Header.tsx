'use client';

import { useRef } from 'react';
import ThemeToggle from "./ThemeToggle";
import { useWorkflowStore } from '@/app/store/workflowStore';
import { Button } from '@/app/components/ui/Button';

export default function Header() {
    const { nodes, edges, setWorkflow, isPlaygroundVisible, setIsPlaygroundVisible, resetMessages } = useWorkflowStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

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
    return (
        <header className="flex shrink-0 items-center justify-between border-b border-solid border-slate-200 dark:border-border-dark px-6 py-3 bg-white dark:bg-background-dark z-20">
            <div className="flex items-center gap-4">
                <div className="size-8 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[32px]">hub</span>
                </div>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Atom AI Builder</h2>
            </div>
            <div className="flex items-center gap-3">
                {/* <button className="flex items-center justify-center rounded-lg h-9 px-3 bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-[20px] mr-2">save</span>
                    <span className="text-sm font-bold">Save Draft</span>
                </button> */}
                <Button
                    onClick={async () => {
                        if (!isPlaygroundVisible) {
                            const telegramNode = nodes.find(n => n.type === 'telegram');
                            if (telegramNode && !telegramNode.data.config.botToken) {
                                useWorkflowStore.getState().setInvalidNodeId(telegramNode.id);
                                alert('El nodo de Telegram requiere un Bot Token para ejecutarse.');
                                return;
                            }

                            // Emit config to backend
                            await fetch('/api/telegram/config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    isActive: !!telegramNode,
                                    botToken: telegramNode?.data.config.botToken || ''
                                })
                            }).catch(err => console.error('Failed to sync configs', err));
                        }

                        resetMessages();
                        setIsPlaygroundVisible(!isPlaygroundVisible);
                    }}
                    variant={isPlaygroundVisible ? 'warning' : 'success'}
                    icon={isPlaygroundVisible ? 'stop' : 'play_arrow'}
                    className="mr-2"
                >
                    {isPlaygroundVisible ? 'Stop' : 'Execute'}
                </Button>
                {/* <button className="flex items-center justify-center rounded-lg h-9 px-3 bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-[20px] mr-2">rocket_launch</span>
                    <span className="text-sm font-bold">Deploy Agent</span>
                </button> */}
                <div className="w-px h-6 bg-slate-200 dark:bg-border-dark mx-1"></div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                <Button
                    variant="secondary"
                    size="icon"
                    icon="upload"
                    onClick={handleImportClick}
                    title="Import Workflow"
                />
                <Button
                    variant="secondary"
                    size="icon"
                    icon="download"
                    onClick={handleExport}
                    title="Export Workflow"
                />
                <ThemeToggle />
                {/* <button className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </button> */}
                {/* <button className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                </button>
                <button className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
                <div className="ml-2 size-9 rounded-full bg-slate-200 dark:bg-border-dark overflow-hidden ring-2 ring-slate-100 dark:ring-border-dark" data-alt="User Avatar">
                    <img alt="User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGpbzWHjsQKtMTaRr4-fQwKKG7lvnqY2ZUXEb3v6e9qLNzrLN10CVX3qdXb97xiuS_DV5ZzCXEEG7-86a8M-QQBCk3ymlHUpnnznHnUNVzVF5gZVC-z0F-7cOaSJ9GGsq7ZOXesPGXPIXmT6qsJczSZ5Zf6PsoaOULQAK9KE_o5DyLm6Zm64A6vJK1_eDGSubNXrrnk8K9V0nGoazzkJXLRZ_zjgGVG6lKuIz5sy_Z9XIi3nd4jfcTwK4GAKwLyanPE6xUQG5vpoQ" />
                </div> */}
            </div>
        </header>
    );
}
