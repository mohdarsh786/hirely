import React from 'react';

export const InterviewScheduleDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Calendar Base */}
        <rect x="80" y="60" width="240" height="220" rx="12" fill="white" stroke="#0F172A" strokeWidth="6" />

        {/* Calendar Header */}
        <rect x="80" y="60" width="240" height="50" rx="12" fill="#3B82F6" stroke="#0F172A" strokeWidth="6" />
        <circle cx="110" cy="85" r="8" fill="white" />
        <circle cx="290" cy="85" r="8" fill="white" />

        {/* Calendar Grid */}
        <g stroke="#CBD5E1" strokeWidth="2">
            <line x1="120" y1="140" x2="280" y2="140" />
            <line x1="120" y1="170" x2="280" y2="170" />
            <line x1="120" y1="200" x2="280" y2="200" />
            <line x1="120" y1="230" x2="280" y2="230" />

            <line x1="140" y1="120" x2="140" y2="260" />
            <line x1="180" y1="120" x2="180" y2="260" />
            <line x1="220" y1="120" x2="220" y2="260" />
            <line x1="260" y1="120" x2="260" y2="260" />
        </g>

        {/* Checkmarks on dates */}
        <path d="M130 155 L138 163 L152 149" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M170 185 L178 193 L192 179" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M210 215 L218 223 L232 209" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Highlighted date */}
        <circle cx="250" cy="245" r="14" fill="#F43F5E" fillOpacity="0.2" stroke="#F43F5E" strokeWidth="3" />
        <text x="250" y="251" fontSize="16" fontWeight="bold" fill="#F43F5E" textAnchor="middle">15</text>

        {/* Character pointing at calendar */}
        <g transform="translate(20, 180)">
            {/* Head */}
            <circle cx="30" cy="30" r="22" fill="white" stroke="#0F172A" strokeWidth="5" />
            {/* Happy eyes */}
            <circle cx="22" cy="26" r="2" fill="#0F172A" />
            <circle cx="38" cy="26" r="2" fill="#0F172A" />
            {/* Smile */}
            <path d="M20 34 Q30 40 40 34" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Body */}
            <rect x="12" y="52" width="36" height="60" rx="18" fill="#F59E0B" stroke="#0F172A" strokeWidth="5" />

            {/* Pointing arm */}
            <path d="M48 70 L75 100" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <circle cx="78" cy="104" r="8" fill="white" stroke="#0F172A" strokeWidth="4" />

            {/* Other arm */}
            <path d="M12 70 L-5 90" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />

            {/* Legs */}
            <path d="M20 112 L10 150" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M40 112 L50 150" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Clock element */}
        <g transform="translate(300, 40)">
            <circle cx="50" cy="50" r="30" fill="#FEF08A" stroke="#0F172A" strokeWidth="4" />
            <circle cx="50" cy="50" r="3" fill="#0F172A" />
            {/* Hour hand */}
            <line x1="50" y1="50" x2="50" y2="35" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            {/* Minute hand */}
            <line x1="50" y1="50" x2="62" y2="50" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Decorative stars */}
        <path d="M340 280 L345 285 L350 280 L345 275 Z" fill="#3B82F6" />
        <path d="M60 100 L65 105 L70 100 L65 95 Z" fill="#F43F5E" />
    </svg>
);
