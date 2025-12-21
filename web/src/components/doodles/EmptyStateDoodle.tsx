import React from 'react';

export const EmptyStateDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 300 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Floating Papers */}
        <rect x="50" y="80" width="60" height="80" rx="4" fill="white" stroke="#94A3B8" strokeWidth="3" transform="rotate(-15 80 120)" />
        <rect x="190" y="50" width="50" height="70" rx="4" fill="white" stroke="#94A3B8" strokeWidth="3" transform="rotate(20 215 85)" />

        {/* Box */}
        <rect x="80" y="140" width="140" height="80" rx="8" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="4" />
        <path d="M80 140 L120 180 L180 180 L220 140" fill="#E2E8F0" />

        {/* Character Peeking */}
        <circle cx="150" cy="130" r="30" fill="white" stroke="#0F172A" strokeWidth="4" />
        <path d="M140 125 Q150 135 160 125" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="140" cy="120" r="2" fill="#0F172A" />
        <circle cx="160" cy="120" r="2" fill="#0F172A" />

        {/* Hands on box */}
        <circle cx="110" cy="140" r="10" fill="white" stroke="#0F172A" strokeWidth="3" />
        <circle cx="190" cy="140" r="10" fill="white" stroke="#0F172A" strokeWidth="3" />

        {/* Dust/Cobweb */}
        <path d="M230 200 L240 210 M240 200 L230 210" stroke="#CBD5E1" strokeWidth="2" />
    </svg>
);
