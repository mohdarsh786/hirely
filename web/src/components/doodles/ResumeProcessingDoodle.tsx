import React from 'react';

export const ResumeProcessingDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Background documents stack */}
        <rect x="140" y="85" width="140" height="180" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="4" />
        <rect x="150" y="95" width="140" height="180" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="4" />

        {/* Main document */}
        <rect x="160" y="105" width="140" height="180" rx="8" fill="white" stroke="#0F172A" strokeWidth="5" />

        {/* Document lines */}
        <line x1="180" y1="130" x2="280" y2="130" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="150" x2="260" y2="150" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="170" x2="270" y2="170" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="190" x2="250" y2="190" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="210" x2="275" y2="210" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="230" x2="265" y2="230" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />

        {/* AI Scanning effect - magnifying glass */}
        <g transform="translate(80, 150)">
            <circle cx="40" cy="40" r="35" fill="white" stroke="#3B82F6" strokeWidth="6" />
            <circle cx="40" cy="40" r="28" fill="#EFF6FF" />

            {/* Inner lens */}
            <circle cx="40" cy="40" r="20" fill="none" stroke="#3B82F6" strokeWidth="2" />

            {/* Handle */}
            <line x1="65" y1="65" x2="90" y2="90" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />

            {/* Sparkles indicating AI analysis */}
            <path d="M35 35 L37 40 L42 42 L37 44 L35 49 L33 44 L28 42 L33 40 Z" fill="#F59E0B" />
        </g>

        {/* Star ratings */}
        <g transform="translate(200, 245)">
            <path d="M10 5 L12 12 L19 12 L13 17 L15 24 L10 19 L5 24 L7 17 L1 12 L8 12 Z" fill="#F59E0B" />
            <path d="M30 5 L32 12 L39 12 L33 17 L35 24 L30 19 L25 24 L27 17 L21 12 L28 12 Z" fill="#F59E0B" />
            <path d="M50 5 L52 12 L59 12 L53 17 L55 24 L50 19 L45 24 L47 17 L41 12 L48 12 Z" fill="#F59E0B" />
            <path d="M70 5 L72 12 L79 12 L73 17 L75 24 L70 19 L65 24 L67 17 L61 12 L68 12 Z" fill="#CBD5E1" />
            <path d="M90 5 L92 12 L99 12 L93 17 L95 24 L90 19 L85 24 L87 17 L81 12 L88 12 Z" fill="#CBD5E1" />
        </g>

        {/* AI Robot character */}
        <g transform="translate(280, 60)">
            {/* Head */}
            <rect x="20" y="20" width="50" height="45" rx="8" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />

            {/* Antenna */}
            <line x1="45" y1="20" x2="45" y2="5" stroke="#0F172A" strokeWidth="3" />
            <circle cx="45" cy="3" r="4" fill="#F43F5E" stroke="#0F172A" strokeWidth="2" />

            {/* Eyes */}
            <circle cx="35" cy="35" r="5" fill="white" />
            <circle cx="55" cy="35" r="5" fill="white" />
            <circle cx="35" cy="35" r="2" fill="#0F172A" />
            <circle cx="55" cy="35" r="2" fill="#0F172A" />

            {/* Smile */}
            <path d="M30 50 Q45 58 60 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Body */}
            <rect x="25" y="65" width="40" height="35" rx="6" fill="#60A5FA" stroke="#0F172A" strokeWidth="4" />

            {/* Arms */}
            <rect x="10" y="70" width="15" height="8" rx="4" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <rect x="65" y="70" width="15" height="8" rx="4" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
        </g>

        {/* Processing indicator dots */}
        <g transform="translate(100, 300)">
            <circle cx="0" cy="0" r="6" fill="#3B82F6" />
            <circle cx="20" cy="0" r="6" fill="#60A5FA" />
            <circle cx="40" cy="0" r="6" fill="#93C5FD" />
        </g>

        {/* Checkmark badge */}
        <g transform="translate(310, 260)">
            <circle cx="25" cy="25" r="20" fill="#10B981" stroke="#0F172A" strokeWidth="4" />
            <path d="M15 25 L22 32 L35 19" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
    </svg>
);
