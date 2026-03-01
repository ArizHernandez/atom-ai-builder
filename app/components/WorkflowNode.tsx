import React from 'react';

export type PortProps = {
    positionClass: string;
    colorClass: string;
    isMain?: boolean;
};

type WorkflowNodeProps = {
    left: string;
    top: string;
    width?: string;
    gradientFrom: string;
    gradientTo: string;
    iconBg: string;
    iconColor: string;
    iconName: string;
    title: string;
    subtitle: string;
    headerBadge?: React.ReactNode;
    headerAction?: React.ReactNode;
    children?: React.ReactNode;
    ports: PortProps[];
    ringClass?: string;
    shadowClass?: string;
    borderClass?: string;
};

export default function WorkflowNode({
    left,
    top,
    width = "280px",
    gradientFrom,
    gradientTo,
    iconBg,
    iconColor,
    iconName,
    title,
    subtitle,
    headerBadge,
    headerAction,
    children,
    ports,
    ringClass,
    shadowClass = "shadow-xl",
    borderClass = "border-slate-200 dark:border-border-dark",
}: WorkflowNodeProps) {
    return (
        <div
            className={`absolute bg-white dark:bg-surface-dark rounded-xl border ${borderClass} ${ringClass || ''} ${shadowClass} z-10 hover:border-primary/50 transition-colors group`}
            style={{ left, top, width }}
        >
            <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} h-1.5 w-full rounded-t-xl`}></div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`size-8 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
                            <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white text-sm font-bold">{title}</h3>
                            <p className="text-slate-500 text-xs">{subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {headerBadge}
                        {headerAction}
                    </div>
                </div>
                {children}
            </div>

            {/* Ports */}
            {ports.map((port, index) => (
                <div
                    key={index}
                    className={`absolute ${port.positionClass} size-3 ${port.colorClass} rounded-full border-2 border-white dark:border-background-dark cursor-crosshair ${port.isMain ? 'hover:scale-125 transition-transform' : ''}`}
                ></div>
            ))}
        </div>
    );
}
