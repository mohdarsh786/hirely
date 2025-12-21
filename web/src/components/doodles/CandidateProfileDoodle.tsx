import React from 'react';

export const CandidateProfileDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* ID Card/Profile */}
        <g transform="translate(100, 50)">
            <rect x="0" y="0" width="200" height="140" rx="12" fill="white" stroke="#0F172A" strokeWidth="4" />
            
            {/* Card header */}
            <rect x="0" y="0" width="200" height="35" rx="12" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />
            
            {/* Profile picture */}
            <circle cx="50" cy="80" r="28" fill="#E0E7FF" stroke="#0F172A" strokeWidth="3" />
            <circle cx="50" cy="72" r="10" fill="white" stroke="#0F172A" strokeWidth="2" />
            <path d="M30 95 Q50 88 70 95" fill="white" stroke="#0F172A" strokeWidth="2" />
            
            {/* Info lines */}
            <line x1="90" y1="60" x2="180" y2="60" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <line x1="90" y1="75" x2="165" y2="75" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <line x1="90" y1="90" x2="170" y2="90" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <line x1="90" y1="105" x2="155" y2="105" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            
            {/* Badge/Star */}
            <g transform="translate(165, 110)">
                <path d="M15 0 L18 10 L28 10 L20 16 L23 26 L15 20 L7 26 L10 16 L2 10 L12 10 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            </g>
        </g>

        {/* Floating documents */}
        <g transform="translate(50, 180)">
            <rect x="0" y="0" width="35" height="45" rx="3" fill="white" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="6" y1="10" x2="29" y2="10" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="6" y1="17" x2="29" y2="17" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="6" y1="24" x2="22" y2="24" stroke="#CBD5E1" strokeWidth="2" />
        </g>

        <g transform="translate(315, 160)">
            <rect x="0" y="0" width="35" height="45" rx="3" fill="white" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="6" y1="10" x2="29" y2="10" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="6" y1="17" x2="29" y2="17" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="6" y1="24" x2="22" y2="24" stroke="#CBD5E1" strokeWidth="2" />
        </g>

        {/* Checkmark */}
        <g transform="translate(320, 70)">
            <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#0F172A" strokeWidth="3" />
            <path d="M12 20 L17 25 L28 14" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>

        {/* Decorative elements */}
        <circle cx="70" cy="80" r="4" fill="#F59E0B" />
        <circle cx="340" cy="240" r="5" fill="#3B82F6" />
    </svg>
);
