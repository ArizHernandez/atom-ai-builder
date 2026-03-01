import WorkflowNode from "./WorkflowNode";

export default function Canvas() {
    return (
        <main className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-background-dark canvas-grid flex flex-col">
            {/* Canvas Toolbar (Floating) */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">Customer Support Workflow</h1>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <span className="inline-block size-2 rounded-full bg-green-500"></span>
                        <span>Active</span>
                        <span className="mx-1">•</span>
                        <span>Last edited 2m ago</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-surface-dark p-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-border-dark pointer-events-auto">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-border-dark rounded text-slate-600 dark:text-slate-300 transition-colors" title="Zoom Out">
                        <span className="material-symbols-outlined text-[20px]">remove</span>
                    </button>
                    <span className="text-xs font-mono min-w-[3ch] text-center text-slate-600 dark:text-slate-300">100%</span>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-border-dark rounded text-slate-600 dark:text-slate-300 transition-colors" title="Zoom In">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-1"></div>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-border-dark rounded text-slate-600 dark:text-slate-300 transition-colors" title="Fit to Screen">
                        <span className="material-symbols-outlined text-[20px]">fit_screen</span>
                    </button>
                </div>
            </div>

            {/* Nodes Container (Simulated) */}
            <div className="absolute inset-0 overflow-auto">
                <div className="relative w-[2000px] h-[2000px] p-20">

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {/* Line Start to Process */}
                        <path className="dark:stroke-[#3b4154] stroke-slate-300" d="M380 250 C 480 250, 480 250, 580 250" fill="none" strokeWidth="2"></path>
                        {/* Line Process to End */}
                        <path className="dark:stroke-[#3b4154] stroke-slate-300" d="M880 250 C 980 250, 980 250, 1080 250" fill="none" strokeWidth="2"></path>
                        {/* Line Process to Specialist */}
                        <path className="dark:stroke-[#3b4154] stroke-slate-300" d="M730 320 C 730 380, 730 380, 730 440" fill="none" strokeWidth="2"></path>
                    </svg>

                    {/* Start Node */}
                    <WorkflowNode
                        left="100px"
                        top="200px"
                        width="280px"
                        gradientFrom="from-blue-600"
                        gradientTo="to-blue-500"
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-500"
                        iconName="play_arrow"
                        title="Start Trigger"
                        subtitle="Incoming Webhook"
                        headerAction={<button className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>}
                        ports={[
                            { positionClass: "-right-1.5 top-1/2 -translate-y-1/2", colorClass: "bg-blue-500", isMain: true }
                        ]}
                    >
                        <div className="bg-slate-50 dark:bg-background-dark rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 mb-2 mt-2">
                            POST /api/v1/support
                        </div>
                    </WorkflowNode>

                    {/* Process Node */}
                    <WorkflowNode
                        left="580px"
                        top="180px"
                        width="300px"
                        gradientFrom="from-primary"
                        gradientTo="to-purple-500"
                        iconBg="bg-primary/10"
                        iconColor="text-primary"
                        iconName="neurology"
                        title="Intent Analysis"
                        subtitle="LLM Processor"
                        borderClass="border-primary"
                        ringClass="ring-2 ring-primary/20"
                        shadowClass="shadow-2xl shadow-primary/10"
                        headerBadge={<span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">Active</span>}
                        ports={[
                            { positionClass: "-left-1.5 top-1/2 -translate-y-1/2", colorClass: "bg-slate-400" },
                            { positionClass: "-right-1.5 top-1/2 -translate-y-1/2", colorClass: "bg-primary", isMain: true },
                            { positionClass: "left-1/2 -bottom-1.5 -translate-x-1/2", colorClass: "bg-purple-500", isMain: true }
                        ]}
                    >
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Model</span>
                                <span className="text-slate-200">GPT-4 Turbo</span>
                            </div>
                            <div className="h-1 w-full bg-slate-200 dark:bg-border-dark rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3"></div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Temperature: 0.7</span>
                                <span>Tokens: 450</span>
                            </div>
                        </div>
                    </WorkflowNode>

                    {/* Specialist Node */}
                    <WorkflowNode
                        left="580px"
                        top="440px"
                        width="280px"
                        gradientFrom="from-purple-500"
                        gradientTo="to-pink-500"
                        iconBg="bg-purple-500/10"
                        iconColor="text-purple-500"
                        iconName="support_agent"
                        title="Billing Agent"
                        subtitle="Specialist"
                        ports={[
                            { positionClass: "left-1/2 -top-1.5 -translate-x-1/2", colorClass: "bg-slate-400" }
                        ]}
                    >
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">Handles refunds and invoice queries.</p>
                    </WorkflowNode>

                    {/* End Node */}
                    <WorkflowNode
                        left="1080px"
                        top="200px"
                        width="280px"
                        gradientFrom="from-emerald-500"
                        gradientTo="to-teal-500"
                        iconBg="bg-emerald-500/10"
                        iconColor="text-emerald-500"
                        iconName="send"
                        title="Response"
                        subtitle="Slack Notification"
                        ports={[
                            { positionClass: "-left-1.5 top-1/2 -translate-y-1/2", colorClass: "bg-slate-400" }
                        ]}
                    >
                        <div className="flex -space-x-2 overflow-hidden mt-4">
                            <img alt="User 1" className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-surface-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCw1NA1mrMxTJfjPMrj97IJhDQtWe5Ai7Qa8X5awr761Ccxirmc46cB1wQorZM1bJ0pJy6oJxKGdntwiKm8lbZeFCvjAoGzqxBadhW9fqM0lHeESHO81SXRpa6cnocs6_EFrxc7SIm9pKblhsZQe95mG_ugZYaNs65P6J3eysiFsfGt8VSBLVznNddmkcSTi_RL41CIofPfeYsDKmdsVXmwm1Wc6NvPJzAN0W414PXVSFnY8SiVBfUT1lUId-gz2xQ4px7VWm0wIY" />
                            <img alt="User 2" className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-surface-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBw709rVC1Z5CRgs9I39icWjmdtguOfMd3rVpr7dVIYVS37Zv4chCP88EV1FcXtCUjssLyUZnWE99866ttE2GNkm2TXsGIF-XswgwD0HELTc6pYI0Cb4sZSDEt5ZT59DJO5SFc_vAx4b53mrnY_tBC2_wnEyp_okn4n4CdIjdS_EwOgwsCr4cJfOSfFD5bfbqxRbVpFax486mlpSgFW3OfgVwCQtxtif6mCt_OvqmsvS1S1JLvYhCeRSJAzch_PN6MXhshkjZxO560" />
                        </div>
                    </WorkflowNode>

                </div>
            </div>
        </main>
    );
}
