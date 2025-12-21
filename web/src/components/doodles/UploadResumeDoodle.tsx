import React from 'react';

export const UploadResumeDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Cloud upload area */}
        <g transform="translate(120, 80)">
            {/* Cloud shape */}
            <ellipse cx="80" cy="70" rx="70" ry="45" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="5" strokeDasharray="8 4" />

            {/* Upload arrow */}
            <g transform="translate(50, 45)">
                <line x1="30" y1="40" x2="30" y2="0" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" />
                <path d="M30 0 L20 15 M30 0 L40 15" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>

            {/* Document icon */}
            <g transform="translate(45, 50)">
                <rect x="0" y="0" width="30" height="40" rx="4" fill="white" stroke="#0F172A" strokeWidth="3" />
                <line x1="6" y1="10" x2="24" y2="10" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="18" x2="24" y2="18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="26" x2="18" y2="26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            </g>
        </g>

        {/* Character dragging document */}
        <g transform="translate(250, 120)">
            {/* Head */}
            <circle cx="30" cy="30" r="20" fill="white" stroke="#0F172A" strokeWidth="5" />
            {/* Eyes */}
            <circle cx="23" cy="27" r="2" fill="#0F172A" />
            <circle cx="37" cy="27" r="2" fill="#0F172A" />
            {/* Focused expression */}
            <line x1="20" y1="35" x2="40" y2="35" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

            {/* Body */}
            <rect x="15" y="50" width="30" height="45" rx="15" fill="#10B981" stroke="#0F172A" strokeWidth="5" />

            {/* Arms pushing */}
            <path d="M15 65 L-10 75" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M45 65 L70 70" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />

            {/* Legs */}
            <path d="M22 95 L15 130" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M38 95 L45 130" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Floating documents */}
        <g transform="translate(40, 60)">
            <rect x="0" y="0" width="35" height="45" rx="4" fill="white" stroke="#94A3B8" strokeWidth="3" transform="rotate(-15)" />
            <line x1="5" y1="10" x2="25" y2="10" stroke="#CBD5E1" strokeWidth="2" transform="rotate(-15)" />
            <line x1="5" y1="18" x2="25" y2="18" stroke="#CBD5E1" strokeWidth="2" transform="rotate(-15)" />
        </g>

        <g transform="translate(320, 200)">
            <rect x="0" y="0" width="35" height="45" rx="4" fill="white" stroke="#94A3B8" strokeWidth="3" transform="rotate(20)" />
            <line x1="5" y1="10" x2="25" y2="10" stroke="#CBD5E1" strokeWidth="2" transform="rotate(20)" />
            <line x1="5" y1="18" x2="25" y2="18" stroke="#CBD5E1" strokeWidth="2" transform="rotate(20)" />
        </g>

        {/* Progress indicator */}
        <g transform="translate(150, 200)">
            <rect x="0" y="0" width="100" height="8" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
            <rect x="0" y="0" width="65" height="8" rx="4" fill="#3B82F6" />
            <text x="50" y="25" fontSize="12" fill="#64748B" textAnchor="middle">Uploading...</text>
        </g>

        {/* Sparkles */}
        <path d="M100 150 L103 155 L108 158 L103 161 L100 166 L97 161 L92 158 L97 155 Z" fill="#F59E0B" />
        <path d="M340 100 L342 103 L345 105 L342 107 L340 110 L338 107 L335 105 L338 103 Z" fill="#3B82F6" />
    </svg>
);
