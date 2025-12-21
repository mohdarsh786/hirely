import React from 'react';

export const WelcomeDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Sun/Background */}
        <circle cx="320" cy="60" r="40" fill="#FEF08A" />

        {/* Character */}
        <g transform="translate(100, 50)">
            {/* Legs */}
            <path d="M90 180 L70 240" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M110 180 L130 240" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />

            {/* Torso */}
            <path d="M100 100 L100 180" stroke="#0F172A" strokeWidth="8" />
            <rect x="75" y="100" width="50" height="90" rx="25" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />

            {/* Head */}
            <circle cx="100" cy="70" r="35" fill="white" stroke="#0F172A" strokeWidth="6" />

            {/* Happy Face */}
            <path d="M90 75 Q100 85 110 75" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="85" cy="65" r="3" fill="#0F172A" />
            <circle cx="115" cy="65" r="3" fill="#0F172A" />

            {/* Arms (Waving) */}
            <path d="M75 120 L50 160" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M125 120 L160 80 L170 50" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />

            {/* Hand Waving */}
            <path d="M165 40 L180 30 L190 45" stroke="#0F172A" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {/* Message Bubble Base */}
        <path d="M210 60 Q240 60 250 80" stroke="#CBD5E1" strokeWidth="4" fill="none" strokeDasharray="6 6" />

        {/* Plants/Decor */}
        <g transform="translate(30, 220)">
            <path d="M20 30 Q20 0 0 10" stroke="#10B981" strokeWidth="6" fill="none" />
            <path d="M20 30 Q20 0 40 10" stroke="#10B981" strokeWidth="6" fill="none" />
            <path d="M20 30 L20 60" stroke="#0F172A" strokeWidth="4" />
            <rect x="0" y="60" width="40" height="30" rx="4" fill="#F87171" stroke="#0F172A" strokeWidth="4" />
        </g>
    </svg>
);
