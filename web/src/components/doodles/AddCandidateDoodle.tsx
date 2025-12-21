import React from 'react';

export const AddCandidateDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Form/Document */}
        <rect x="80" y="50" width="240" height="200" rx="12" fill="white" stroke="#0F172A" strokeWidth="5" />

        {/* Form header */}
        <rect x="80" y="50" width="240" height="40" rx="12" fill="#3B82F6" stroke="#0F172A" strokeWidth="5" />
        <text x="200" y="78" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">New Candidate</text>

        {/* Form fields (lines) */}
        <line x1="100" y1="120" x2="280" y2="120" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="145" x2="260" y2="145" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="170" x2="270" y2="170" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="195" x2="240" y2="195" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />

        {/* Checkboxes */}
        <rect x="100" y="110" width="12" height="12" rx="2" fill="white" stroke="#94A3B8" strokeWidth="2" />
        <rect x="100" y="135" width="12" height="12" rx="2" fill="white" stroke="#94A3B8" strokeWidth="2" />
        <rect x="100" y="160" width="12" height="12" rx="2" fill="white" stroke="#94A3B8" strokeWidth="2" />
        <rect x="100" y="185" width="12" height="12" rx="2" fill="#10B981" stroke="#0F172A" strokeWidth="2" />

        {/* Checkmark in filled box */}
        <path d="M102 191 L106 195 L110 187" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Character with pen */}
        <g transform="translate(30, 140)">
            {/* Head */}
            <circle cx="25" cy="25" r="18" fill="white" stroke="#0F172A" strokeWidth="4" />
            {/* Eyes */}
            <circle cx="18" cy="22" r="2" fill="#0F172A" />
            <circle cx="32" cy="22" r="2" fill="#0F172A" />
            {/* Smile */}
            <path d="M18 30 Q25 35 32 30" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Body */}
            <rect x="12" y="43" width="26" height="40" rx="13" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />

            {/* Arm holding pen */}
            <path d="M38 55 L60 50" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />

            {/* Pen */}
            <rect x="58" y="46" width="20" height="6" rx="3" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
            <path d="M78 49 L85 49" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Plus icon (add action) */}
        <g transform="translate(330, 60)">
            <circle cx="25" cy="25" r="22" fill="#10B981" stroke="#0F172A" strokeWidth="4" />
            <line x1="25" y1="15" x2="25" y2="35" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <line x1="15" y1="25" x2="35" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* User profile icon */}
        <g transform="translate(320, 190)">
            <circle cx="30" cy="20" r="12" fill="#E0E7FF" stroke="#0F172A" strokeWidth="3" />
            <path d="M15 50 Q30 45 45 50" fill="#E0E7FF" stroke="#0F172A" strokeWidth="3" />
        </g>

        {/* Decorative stars */}
        <path d="M360 140 L363 143 L366 140 L363 137 Z" fill="#F59E0B" />
        <path d="M50 80 L53 83 L56 80 L53 77 Z" fill="#3B82F6" />

        {/* Floating paper effect */}
        <path d="M290 230 Q300 235 310 230" stroke="#CBD5E1" strokeWidth="2" fill="none" strokeDasharray="4 4" />
    </svg>
);
