import React from 'react';

export const LoadingDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Character running with papers */}
        <g transform="translate(150, 100)">
            {/* Head */}
            <circle cx="50" cy="30" r="22" fill="white" stroke="#0F172A" strokeWidth="4" />
            {/* Eyes */}
            <circle cx="43" cy="28" r="2.5" fill="#0F172A" />
            <circle cx="57" cy="28" r="2.5" fill="#0F172A" />
            {/* Focused expression */}
            <path d="M45 36 Q50 38 55 36" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
            
            {/* Body leaning forward */}
            <ellipse cx="50" cy="70" rx="18" ry="28" fill="#3B82F6" stroke="#0F172A" strokeWidth="4" />
            
            {/* Legs running */}
            <path d="M45 95 L35 130 L30 145" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M55 95 L70 125 L75 140" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            
            {/* Arms */}
            <path d="M35 60 L15 75" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M65 60 L90 50" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            
            {/* Papers flying */}
            <g className="animate-bounce">
                <rect x="85" y="35" width="20" height="25" rx="2" fill="white" stroke="#0F172A" strokeWidth="2" />
                <line x1="90" y1="42" x2="100" y2="42" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="90" y1="48" x2="100" y2="48" stroke="#CBD5E1" strokeWidth="1.5" />
            </g>
        </g>

        {/* Spinning clock */}
        <g transform="translate(280, 80)" className="animate-spin" style={{ transformOrigin: '20px 20px' }}>
            <circle cx="20" cy="20" r="18" fill="#FEF08A" stroke="#0F172A" strokeWidth="3" />
            <line x1="20" y1="20" x2="20" y2="10" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            <line x1="20" y1="20" x2="28" y2="20" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Progress dots */}
        <g transform="translate(100, 220)">
            <circle cx="0" cy="0" r="6" fill="#3B82F6" className="animate-pulse" />
            <circle cx="30" cy="0" r="6" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            <circle cx="60" cy="0" r="6" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
        </g>

        {/* Decorative stars */}
        <path d="M80 60 L83 65 L88 65 L84 69 L86 74 L80 71 L74 74 L76 69 L72 65 L77 65 Z" fill="#F59E0B" />
        <path d="M320 180 L322 183 L325 183 L323 185 L324 188 L320 186 L316 188 L317 185 L315 183 L318 183 Z" fill="#10B981" />
    </svg>
);
