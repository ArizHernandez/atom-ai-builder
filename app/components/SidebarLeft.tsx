export default function SidebarLeft() {
    return (
        <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark z-10 shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-border-dark">
                <h1 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-1">Node Library</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Drag to canvas</p>
                <div className="mt-3 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">search</span>
                    </span>
                    <input className="w-full bg-slate-50 dark:bg-background-dark border-none rounded text-xs py-2 pl-8 pr-3 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-1 focus:ring-primary" placeholder="Search nodes..." type="text" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Node Category: Logic */}
                <div className="px-2 py-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Logic &amp; Flow</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">psychology</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Memory</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 cursor-grab active:cursor-grabbing group">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">schema</span>
                            <span className="text-slate-900 dark:text-white text-sm font-medium">Orchestrator</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-teal-500 group-hover:scale-110 transition-transform">fact_check</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Validator</span>
                        </div>
                    </div>
                </div>
                {/* Node Category: Agents */}
                <div className="px-2 py-2 border-t border-slate-100 dark:border-border-dark">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Agents</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-purple-500 group-hover:scale-110 transition-transform">manage_accounts</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Specialist</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-orange-500 group-hover:scale-110 transition-transform">extension</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Generic</span>
                        </div>
                    </div>
                </div>
                {/* Node Category: Tools */}
                <div className="px-2 py-2 border-t border-slate-100 dark:border-border-dark">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-1">Integrations</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-green-500 group-hover:scale-110 transition-transform">webhook</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Webhook</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark cursor-grab active:cursor-grabbing group transition-colors">
                            <span className="material-symbols-outlined text-blue-500 group-hover:scale-110 transition-transform">database</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Database</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark/50">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>v2.4.0</span>
                    <a className="hover:text-primary" href="#">Documentation</a>
                </div>
            </div>
        </aside>
    );
}
