import React from 'react';

export const IconShop = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform transition-transform duration-500 hover:scale-110">
        {/* Drop Shadow */}
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="black" fillOpacity="0.2" filter="blur(4px)" />

        {/* Store Base */}
        <rect x="14" y="28" width="36" height="24" rx="4" fill="url(#paint0_linear)" />
        <rect x="14" y="28" width="36" height="24" rx="4" fill="url(#paint1_linear)" fillOpacity="0.4" />

        {/* 3D Awning (Stripes) */}
        <path d="M10 28L14 16H50L54 28H10Z" fill="#F97316" /> {/* Orange Base */}
        <path d="M18 16L16 28H24L26 16H18Z" fill="#FDBA74" /> {/* Lighter Stripe */}
        <path d="M34 16L32 28H40L42 16H34Z" fill="#FDBA74" /> {/* Lighter Stripe */}

        {/* Awning Scallops */}
        <path d="M10 28C10 30.2 12.2 32 15.5 32C18.8 32 21 30.2 21 28" fill="#F97316" />
        <path d="M21 28C21 30.2 23.2 32 26.5 32C29.8 32 32 30.2 32 28" fill="#FDBA74" />
        <path d="M32 28C32 30.2 34.2 32 37.5 32C40.8 32 43 30.2 43 28" fill="#F97316" />
        <path d="M43 28C43 30.2 45.2 32 48.5 32C51.8 32 54 30.2 54 28" fill="#FDBA74" />

        <defs>
            <linearGradient id="paint0_linear" x1="32" y1="28" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF7ED" />
                <stop offset="1" stopColor="#FFEDD5" />
            </linearGradient>
            <linearGradient id="paint1_linear" x1="14" y1="28" x2="50" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);

export const IconService = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform transition-transform duration-500 hover:scale-110">
        {/* Drop Shadow */}
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="black" fillOpacity="0.2" filter="blur(4px)" />

        {/* Gear (Behind) */}
        <circle cx="38" cy="38" r="14" fill="#60A5FA" stroke="#2563EB" strokeWidth="4" />
        <circle cx="38" cy="38" r="6" fill="#EFF6FF" />

        {/* Wrench (Front - with Gradient) */}
        <g filter="url(#filter0_d)">
            <path d="M26 12C29.3137 12 32 14.6863 32 18C32 19.3 31.6 20.5 30.9 21.5L42 38L38 42L21.5 30.9C20.5 31.6 19.3 32 18 32C14.6863 32 12 29.3137 12 26C12 24 13 22 14.5 21L16 23L23 16L21 14.5C22 13 24 12 26 12Z"
                fill="url(#wrench_grad)" />
        </g>

        <defs>
            <linearGradient id="wrench_grad" x1="12" y1="12" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1E40AF" />
            </linearGradient>
            <filter id="filter0_d" x="8" y="10" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
            </filter>
        </defs>
    </svg>
);

export const IconHeart = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform transition-transform duration-500 hover:scale-110">
        {/* Drop Shadow */}
        <ellipse cx="32" cy="56" rx="16" ry="4" fill="black" fillOpacity="0.2" filter="blur(4px)" />

        {/* Main Heart Shape with Radial Gradient */}
        <path d="M32 52C32 52 54 38 54 22C54 13 45 8 38 11C34.5 12.5 32 16 32 16C32 16 29.5 12.5 26 11C19 8 10 13 10 22C10 38 32 52 32 52Z"
            fill="url(#heart_grad)" />

        {/* White Reflection (The Shine) */}
        <ellipse cx="20" cy="20" rx="4" ry="3" fill="white" fillOpacity="0.4" transform="rotate(-30 20 20)" />

        <defs>
            <radialGradient id="heart_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 20) rotate(56) scale(40)">
                <stop stopColor="#F472B6" /> {/* Pink Highlight */}
                <stop offset="1" stopColor="#BE185D" /> {/* Dark Pink Shadow */}
            </radialGradient>
        </defs>
    </svg>
);
