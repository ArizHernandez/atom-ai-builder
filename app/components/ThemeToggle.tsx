"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove("dark");
            setIsDark(false);
        } else {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-[#3b4154] text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle theme"
        >
            <span className="material-symbols-outlined text-[20px]">
                {isDark ? "light_mode" : "dark_mode"}
            </span>
        </button>
    );
}
