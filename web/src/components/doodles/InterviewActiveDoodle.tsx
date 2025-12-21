import React from 'react';

export const InterviewActiveDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Microphone */}
        <g transform="translate(80, 80)">
            <rect x="35" y="20" width="30" height="50" rx="15" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />
            <path d="M20 55 Q20 80 50 80 Q80 80 80 55" stroke="#0F172A" strokeWidth="4" fill="none" strokeLinecap="round" />
            <line x1="50" y1="80" x2="50" y2="100" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <rect x="30" y="100" width="40" height="8" rx="4" fill="#0F172A" />
            {/* Sound waves */}
            <path d="M90 40 Q95 40 95 45 Q95 50 90 50" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M100 35 Q108 35 108 45 Q108 55 100 55" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M10 40 Q5 40 5 45 Q5 50 10 50" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M0 35 Q-8 35 -8 45 Q-8 55 0 55" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Character speaking */}
        <g transform="translate(220, 100)">
            {/* Head */}
            <circle cx="40" cy="30" r="25" fill="white" stroke="#0F172A" strokeWidth="4" />
            {/* Eyes */}
            <circle cx="32" cy="26" r="3" fill="#0F172A" />
            <circle cx="48" cy="26" r="3" fill="#0F172A" />
            {/* Speaking mouth */}
            <ellipse cx="40" cy="36" rx="8" ry="6" fill="#0F172A" />
            
            {/* Body */}
            <rect x="22" y="55" width="36" height="50" rx="18" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
            
            {/* Arms gesturing */}
            <path d="M22 70 L0 85" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M58 70 L80 85" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            
            {/* Speech bubble */}
            <g transform="translate(70, 10)">
                <ellipse cx="30" cy="15" rx="35" ry="20" fill="white" stroke="#0F172A" strokeWidth="3" />
                <path d="M10 25 L5 35 L15 28" fill="white" stroke="#0F172A" strokeWidth="3" />
                <text x="30" y="20" fontSize="14" fontWeight="bold" fill="#0F172A" textAnchor="middle">...</text>
            </g>
        </g>

        {/* Decorative stars */}
        <path d="M50 200 L53 205 L58 205 L54 209 L56 214 L50 211 L44 214 L46 209 L42 205 L47 205 Z" fill="#F59E0B" />
        <path d="M350 120 L352 123 L355 123 L353 125 L354 128 L350 126 L346 128 L347 125 L345 123 L348 123 Z" fill="#3B82F6" />
    </svg>
);
