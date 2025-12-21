import React from 'react';

export const HRChatDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Robot Assistant */}
        <g transform="translate(80, 80)">
            {/* Head */}
            <rect x="40" y="30" width="80" height="70" rx="12" fill="#3B82F6" stroke="#0F172A" strokeWidth="6" />

            {/* Antenna */}
            <line x1="80" y1="30" x2="80" y2="10" stroke="#0F172A" strokeWidth="4" />
            <circle cx="80" cy="7" r="7" fill="#F59E0B" stroke="#0F172A" strokeWidth="3" />

            {/* Eyes */}
            <circle cx="60" cy="55" r="10" fill="white" />
            <circle cx="100" cy="55" r="10" fill="white" />
            <circle cx="60" cy="55" r="5" fill="#0F172A" />
            <circle cx="100" cy="55" r="5" fill="#0F172A" />

            {/* Happy smile */}
            <path d="M50 75 Q80 90 110 75" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* Body */}
            <rect x="50" y="100" width="60" height="50" rx="10" fill="#60A5FA" stroke="#0F172A" strokeWidth="6" />

            {/* Control panel indicators */}
            <circle cx="70" cy="120" r="4" fill="#10B981" />
            <circle cx="80" cy="120" r="4" fill="#F59E0B" />
            <circle cx="90" cy="120" r="4" fill="#F43F5E" />

            {/* Arms */}
            <rect x="20" y="110" width="30" height="12" rx="6" fill="#3B82F6" stroke="#0F172A" strokeWidth="5" />
            <rect x="110" y="110" width="30" height="12" rx="6" fill="#3B82F6" stroke="#0F172A" strokeWidth="5" />

            {/* Waving hand */}
            <circle cx="17" cy="116" r="8" fill="white" stroke="#0F172A" strokeWidth="4" />
        </g>

        {/* Speech bubble 1 - Question */}
        <g transform="translate(240, 80)">
            <ellipse cx="60" cy="35" rx="55" ry="30" fill="white" stroke="#0F172A" strokeWidth="4" />
            <path d="M15 45 L10 60 L25 50" fill="white" stroke="#0F172A" strokeWidth="4" />

            {/* Question mark */}
            <text x="60" y="45" fontSize="28" fontWeight="bold" fill="#F43F5E" textAnchor="middle">?</text>
        </g>

        {/* Speech bubble 2 - Answer */}
        <g transform="translate(220, 140)">
            <rect x="10" y="10" width="90" height="50" rx="12" fill="#EFF6FF" stroke="#0F172A" strokeWidth="4" />
            <path d="M20 60 L15 75 L30 65" fill="#EFF6FF" stroke="#0F172A" strokeWidth="4" />

            {/* Text lines */}
            <line x1="20" y1="25" x2="90" y2="25" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            <line x1="20" y1="35" x2="80" y2="35" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            <line x1="20" y1="45" x2="85" y2="45" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Book/Knowledge base */}
        <g transform="translate(30, 200)">
            <rect x="10" y="5" width="60" height="10" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />
            <rect x="5" y="15" width="60" height="10" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
            <rect x="0" y="25" width="60" height="50" rx="4" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />

            {/* Book spine details */}
            <line x1="10" y1="35" x2="10" y2="70" stroke="#D97706" strokeWidth="2" />
            <text x="30" y="58" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">HR</text>
        </g>

        {/* Lightbulb idea */}
        <g transform="translate(300, 200)">
            {/* Bulb */}
            <circle cx="30" cy="30" r="20" fill="#FEF08A" stroke="#0F172A" strokeWidth="4" />
            <path d="M20 45 L40 45 L38 60 L22 60 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="3" />

            {/* Light rays */}
            <line x1="30" y1="5" x2="30" y2="0" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="12" x2="53" y2="7" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="30" x2="60" y2="30" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="12" x2="7" y2="7" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="5" y1="30" x2="0" y2="30" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Decorative sparkles */}
        <path d="M350 50 L353 55 L358 58 L353 61 L350 66 L347 61 L342 58 L347 55 Z" fill="#3B82F6" />
        <path d="M60 50 L62 53 L65 55 L62 57 L60 60 L58 57 L55 55 L58 53 Z" fill="#F43F5E" />
    </svg>
);
