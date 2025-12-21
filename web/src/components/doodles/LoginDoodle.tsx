import React from 'react';

export const LoginDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 500 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Abstract Background Shapes */}
        <circle cx="250" cy="200" r="180" fill="#F1F5F9" />
        <circle cx="400" cy="100" r="50" fill="#E2E8F0" fillOpacity="0.5" />
        <circle cx="100" cy="300" r="40" fill="#E2E8F0" fillOpacity="0.5" />

        {/* Character 1 (Standing Left) */}
        <g transform="translate(140, 120)">
            {/* Body */}
            <path d="M40 70 L40 180" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M40 180 L20 250" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M40 180 L60 250" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            {/* Arms */}
            <path d="M40 100 L10 140" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M40 100 L70 130" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            {/* Head */}
            <circle cx="40" cy="40" r="25" stroke="#0F172A" strokeWidth="6" fill="white" />
            {/* Shirt */}
            <path d="M15 70 Q40 130 65 70 L65 150 L15 150 Z" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />
        </g>

        {/* Character 2 (Sitting Right) */}
        <g transform="translate(280, 140)">
            {/* Desk */}
            <rect x="0" y="110" width="120" height="8" rx="4" fill="#64748B" />
            <path d="M20 118 L20 230" stroke="#64748B" strokeWidth="6" />
            <path d="M100 118 L100 230" stroke="#64748B" strokeWidth="6" />

            {/* Laptop */}
            <rect x="40" y="85" width="50" height="35" rx="4" fill="#94A3B8" stroke="#0F172A" strokeWidth="4" />

            {/* Character Standing behind desk/Presenting */}
            <path d="M160 80 L160 200" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M160 200 L140 250" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M160 200 L180 250" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            {/* Arms */}
            <path d="M160 100 L130 140" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <path d="M160 100 L190 90" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            {/* Head */}
            <circle cx="160" cy="50" r="25" stroke="#0F172A" strokeWidth="6" fill="white" />
            {/* Shirt */}
            <rect x="140" y="80" width="40" height="80" rx="10" fill="#F43F5E" stroke="#0F172A" strokeWidth="4" />
        </g>

        {/* Decorative Elements */}
        <path d="M80 50 L100 70 L120 50" stroke="#3B82F6" strokeWidth="4" fill="none" />
        <circle cx="420" cy="320" r="6" fill="#F43F5E" />
        <circle cx="40" cy="180" r="8" fill="#3B82F6" />
    </svg>
);
