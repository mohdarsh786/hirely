import React from 'react';

export const TeamDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Three team members */}
        {/* Person 1 - Left */}
        <g transform="translate(60, 100)">
            <circle cx="30" cy="25" r="20" fill="white" stroke="#0F172A" strokeWidth="4" />
            <circle cx="24" cy="22" r="2.5" fill="#0F172A" />
            <circle cx="36" cy="22" r="2.5" fill="#0F172A" />
            <path d="M24 30 Q30 33 36 30" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="12" y="45" width="36" height="50" rx="18" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />
            <path d="M12 70 L0 95" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M48 70 L60 95" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Person 2 - Center (slightly forward) */}
        <g transform="translate(170, 80)">
            <circle cx="30" cy="25" r="22" fill="white" stroke="#0F172A" strokeWidth="4" />
            <circle cx="23" cy="22" r="2.5" fill="#0F172A" />
            <circle cx="37" cy="22" r="2.5" fill="#0F172A" />
            <path d="M23 30 Q30 34 37 30" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="10" y="47" width="40" height="55" rx="20" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
            <path d="M10 75 L-5 105" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 75 L65 105" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            {/* Crown/Leader indicator */}
            <path d="M20 5 L25 15 L30 0 L35 15 L40 5 L38 20 L22 20 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* Person 3 - Right */}
        <g transform="translate(280, 100)">
            <circle cx="30" cy="25" r="20" fill="white" stroke="#0F172A" strokeWidth="4" />
            <circle cx="24" cy="22" r="2.5" fill="#0F172A" />
            <circle cx="36" cy="22" r="2.5" fill="#0F172A" />
            <path d="M24 30 Q30 33 36 30" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="12" y="45" width="36" height="50" rx="18" fill="#10B981" stroke="#0F172A" strokeWidth="4" />
            <path d="M12 70 L0 95" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M48 70 L60 95" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Connection lines */}
        <path d="M120 150 Q150 140 180 150" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="6 4" />
        <path d="M240 150 Q270 140 300 150" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="6 4" />

        {/* Decorative stars */}
        <path d="M50 50 L52 54 L56 54 L53 57 L54 61 L50 59 L46 61 L47 57 L44 54 L48 54 Z" fill="#F59E0B" />
        <path d="M350 180 L352 183 L355 183 L353 185 L354 188 L350 186 L346 188 L347 185 L345 183 L348 183 Z" fill="#3B82F6" />
    </svg>
);
