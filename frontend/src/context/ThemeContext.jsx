import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Theme is now unified, so no toggling needed.
    // Keeping context structure to avoid breaking imports in components.
    const theme = 'light';

    useEffect(() => {
        // Enforce light class for now to ensure variables load if they rely on it,
        // though we moved variables to :root so this is less critical.
        const root = window.document.documentElement;
        root.classList.add('light');
    }, []);

    const toggleTheme = () => {
        // No-op
        console.warn("Theme toggling is disabled in Unified Neutral Theme");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
