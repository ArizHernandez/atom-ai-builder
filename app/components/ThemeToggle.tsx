"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";

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
        <Button
            onClick={toggleTheme}
            variant="secondary"
            size="icon"
            icon={isDark ? "light_mode" : "dark_mode"}
            title="Toggle theme"
        />
    );
}
