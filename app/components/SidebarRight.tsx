export default function SidebarRight() {
    return (
        <aside className="w-[360px] flex flex-col border-l border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark z-20 shadow-xl shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                    <h2 className="text-slate-900 dark:text-white font-bold text-sm">Playground</h2>
                </div>
                <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-border-dark rounded text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-border-dark rounded text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </div>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-background-dark/50 relative">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* System Message */}
                    <div className="flex justify-center">
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-border-dark px-2 py-1 rounded-full">Session started at 10:42 AM</span>
                    </div>
                    {/* Bot Message */}
                    <div className="flex gap-3">
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <span className="text-[10px] text-slate-400 font-medium ml-1">Atom AI</span>
                            <div className="p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-200 shadow-sm leading-relaxed">
                                Hello! I'm ready to test your workflow. How can I assist you today?
                            </div>
                        </div>
                    </div>
                    {/* User Message */}
                    <div className="flex gap-3 flex-row-reverse">
                        <div className="size-8 rounded-full bg-slate-200 dark:bg-border-dark flex items-center justify-center shrink-0 overflow-hidden" data-alt="User Avatar Small">
                            <img alt="User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS3AI8dfRY6eG2J6gLUYGz_5uEbmvnPZNPySveS9TtYNULy-d89-wD_2TWc5f6BytegtiinnyYo42F7nKykWcKT7zmf2e54MQAIS5cHL1-1HiXezDEDi1eJY_kevRPrMV5-SJ6Dn3bWdSDmqnBGiPFxqNRXup4uhpksbHABvaCOG8dY8cmCIWdUdZBhqZ-q_x8SMuvckrVThD9WY9bT9vd3fIKR-6QZwdJDtHb1cGAsX42XCS2COlv1xFKrE6Nvbl6P5Xijug1-aY" />
                        </div>
                        <div className="flex flex-col gap-1 items-end max-w-[85%]">
                            <span className="text-[10px] text-slate-400 font-medium mr-1">You</span>
                            <div className="p-3 bg-primary text-white rounded-2xl rounded-tr-none text-sm shadow-sm leading-relaxed">
                                I need to check the status of my refund #REF-2024.
                            </div>
                        </div>
                    </div>
                    {/* Bot Thinking State */}
                    <div className="flex gap-3 animate-pulse">
                        <div className="size-8 rounded-full bg-primary/50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white text-[16px]">more_horiz</span>
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className="flex items-center gap-2 ml-1">
                                <span className="text-[10px] text-primary font-medium">Processing</span>
                                <span className="size-1.5 bg-primary rounded-full animate-ping"></span>
                            </div>
                            <div className="p-3 bg-white dark:bg-surface-dark border border-primary/30 rounded-2xl rounded-tl-none text-sm text-slate-500 dark:text-slate-400 shadow-sm italic border-dashed">
                                Analyzing intent and routing to billing specialist...
                            </div>
                        </div>
                    </div>
                </div>
                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark">
                    <div className="relative">
                        <textarea className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none pr-12 scrollbar-hide shadow-inner" placeholder="Type a message..." rows={2}></textarea>
                        <button className="absolute bottom-2 right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-[20px] block transform rotate-[-45deg] translate-x-px -translate-y-px">send</span>
                        </button>
                    </div>
                    <div className="flex justify-between items-center mt-3 px-1">
                        <div className="flex gap-2">
                            <button className="text-slate-400 hover:text-primary transition-colors" title="Attach file">
                                <span className="material-symbols-outlined text-[20px]">attach_file</span>
                            </button>
                            <button className="text-slate-400 hover:text-primary transition-colors" title="Voice input">
                                <span className="material-symbols-outlined text-[20px]">mic</span>
                            </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                            Press Enter to send
                        </div>
                    </div>
                </div>
            </div>
            {/* Debug Panel (Collapsible) */}
            <div className="border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark/30">
                <button className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-border-dark transition-colors">
                    <span>Debug Console</span>
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
            </div>
        </aside>
    );
}
