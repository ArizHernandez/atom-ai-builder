import React, { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: string;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#2559f4] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-transparent',
    secondary: 'bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-700 dark:text-slate-200 border border-transparent',
    outline: 'bg-transparent hover:bg-slate-50 dark:hover:bg-[#282c39] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border-dark',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-[#282c39] text-slate-600 dark:text-slate-300 border border-transparent',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border border-transparent',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border border-transparent',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-11 px-5 text-base',
    icon: 'size-9 p-0 flex items-center justify-center', // Exact square for icons
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            icon,
            iconPosition = 'left',
            isLoading = false,
            fullWidth = false,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        // Base classes
        const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#2559f4]/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

        // Combine all styles
        const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
      cursor-pointer
    `.replace(/\s+/g, ' ').trim();

        // Determine icon size based on button size, icon variant usually uses slightly larger
        const iconSizeClass = size === 'sm' ? 'text-[16px]' : size === 'lg' ? 'text-[24px]' : 'text-[20px]';

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={combinedClassName}
                {...props}
            >
                {isLoading && (
                    <span className={`material-symbols-outlined ${iconSizeClass} animate-spin ${children || iconPosition === 'right' ? 'mr-2' : ''}`}>
                        refresh
                    </span>
                )}

                {!isLoading && icon && iconPosition === 'left' && (
                    <span className={`material-symbols-outlined ${iconSizeClass} ${children ? 'mr-2' : ''}`}>
                        {icon}
                    </span>
                )}

                {children}

                {!isLoading && icon && iconPosition === 'right' && (
                    <span className={`material-symbols-outlined ${iconSizeClass} ${children ? 'ml-2' : ''}`}>
                        {icon}
                    </span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
