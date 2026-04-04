/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Keeping class strategy to avoid system preference overrides, but we won't toggle it.
    theme: {
        extend: {
            colors: {
                // Semantic Palette
                primary: {
                    DEFAULT: '#0f766e', // Teal 700
                    hover: '#0d9488',   // Teal 600
                    light: '#14b8a6',   // Teal 500
                    subtle: '#cffafe',  // Teal 100 (Backgrounds)
                },
                coral: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    subtle: '#f8fafc',  // Slate 50
                    muted: '#f1f5f9',   // Slate 100
                },
                dark: {
                    DEFAULT: '#0f172a', // Slate 900
                    muted: '#334155',   // Slate 700
                    subtle: '#94a3b8',  // Slate 400
                },
                pastel: {
                    mint: '#f0fdf4',    // Green 50 (Success/Fresh)
                    rose: '#fff1f2',    // Rose 50 (Warmth)
                    amber: '#fffbeb',   // Amber 50 (Caution/Discovery)
                    blue: '#eff6ff',    // Blue 50 (Neutral)
                },
                // Keeping legacy names briefly to prevent immediate breakage, but mapped to new tokens
                background: '#f8fafc',
                text: '#0f172a',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(15, 118, 110, 0.1)', // Teal tinted shadow
                'card': '0 2px 10px -1px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(20, 184, 166, 0.5)', // For map dots
            },
            borderRadius: {
                'xl': '12px', // Standard card radius
                '2xl': '20px', // Feature card radius
                '3xl': '32px', // Modern soft feel
            },
            animation: {
                'fade-up': 'fadeUp 0.8s ease-out forwards',
                'fadeInUp': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'blob': 'blob 7s infinite',
                'gradient': 'gradient 8s ease infinite',
                'scan-y': 'scanY 3s linear infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                scanY: {
                    '0%': { top: '0%', opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { top: '100%', opacity: '0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
                }
            }
        },
    },
    plugins: [],
}
