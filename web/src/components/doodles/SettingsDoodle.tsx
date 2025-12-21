import React from 'react';

export const SettingsDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Large gear */}
        <g transform="translate(120, 100)">
            <circle cx="80" cy="80" r="60" fill="#3B82F6" stroke="#0F172A" strokeWidth="6" />
            <circle cx="80" cy="80" r="35" fill="white" stroke="#0F172A" strokeWidth="5" />

            {/* Gear teeth */}
            <rect x="75" y="15" width="10" height="15" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <rect x="75" y="130" width="10" height="15" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <rect x="15" y="75" width="15" height="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <rect x="130" y="75" width="15" height="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />

            <g transform="rotate(45 80 80)">
                <rect x="75" y="15" width="10" height="15" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
                <rect x="75" y="130" width="10" height="15" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
                <rect x="15" y="75" width="15" height="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
                <rect x="130" y="75" width="15" height="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            </g>
        </g>

        {/* Small gear */}
        <g transform="translate(240, 60)">
            <circle cx="40" cy="40" r="35" fill="#F59E0B" stroke="#0F172A" strokeWidth="5" />
            <circle cx="40" cy="40" r="20" fill="white" stroke="#0F172A" strokeWidth="4" />

            {/* Gear teeth */}
            <rect x="37" y="2" width="6" height="10" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <rect x="37" y="68" width="6" height="10" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <rect x="2" y="37" width="10" height="6" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <rect x="68" y="37" width="10" height="6" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* Organizational chart */}
        <g transform="translate(50, 50)">
            {/* Top node */}
            <rect x="20" y="0" width="40" height="30" rx="6" fill="#10B981" stroke="#0F172A" strokeWidth="3" />
            <circle cx="40" cy="10" r="3" fill="white" />
            <line x1="32" y1="18" x2="48" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />

            {/* Connection lines */}
            <line x1="40" y1="30" x2="40" y2="45" stroke="#0F172A" strokeWidth="3" />
            <line x1="40" y1="45" x2="15" y2="45" stroke="#0F172A" strokeWidth="3" />
            <line x1="40" y1="45" x2="65" y2="45" stroke="#0F172A" strokeWidth="3" />
            <line x1="15" y1="45" x2="15" y2="55" stroke="#0F172A" strokeWidth="3" />
            <line x1="65" y1="45" x2="65" y2="55" stroke="#0F172A" strokeWidth="3" />

            {/* Bottom nodes */}
            <rect x="0" y="55" width="30" height="25" rx="5" fill="#60A5FA" stroke="#0F172A" strokeWidth="3" />
            <rect x="50" y="55" width="30" height="25" rx="5" fill="#60A5FA" stroke="#0F172A" strokeWidth="3" />

            {/* Node details */}
            <circle cx="15" cy="63" r="2" fill="white" />
            <circle cx="65" cy="63" r="2" fill="white" />
        </g>

        {/* Sliders/Controls */}
        <g transform="translate(250, 160)">
            {/* Slider 1 */}
            <line x1="10" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
            <circle cx="70" cy="20" r="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />

            {/* Slider 2 */}
            <line x1="10" y1="50" x2="100" y2="50" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
            <circle cx="40" cy="50" r="10" fill="#10B981" stroke="#0F172A" strokeWidth="3" />

            {/* Slider 3 */}
            <line x1="10" y1="80" x2="100" y2="80" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
            <circle cx="85" cy="80" r="10" fill="#F59E0B" stroke="#0F172A" strokeWidth="3" />
        </g>

        {/* Wrench tool */}
        <g transform="translate(40, 200)">
            <rect x="10" y="40" width="10" height="50" rx="3" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
            <ellipse cx="15" cy="30" rx="12" ry="15" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
            <rect x="5" y="25" width="20" height="8" fill="white" stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* Team icons */}
        <g transform="translate(100, 220)">
            {/* Person 1 */}
            <circle cx="15" cy="15" r="10" fill="#F43F5E" stroke="#0F172A" strokeWidth="3" />
            <path d="M5 30 Q15 35 25 30" fill="#F43F5E" stroke="#0F172A" strokeWidth="3" />

            {/* Person 2 */}
            <circle cx="45" cy="15" r="10" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <path d="M35 30 Q45 35 55 30" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />

            {/* Person 3 */}
            <circle cx="75" cy="15" r="10" fill="#10B981" stroke="#0F172A" strokeWidth="3" />
            <path d="M65 30 Q75 35 85 30" fill="#10B981" stroke="#0F172A" strokeWidth="3" />
        </g>

        {/* Decorative elements */}
        <path d="M360 240 L365 245 L370 240 L365 235 Z" fill="#3B82F6" />
        <path d="M20 30 L23 33 L26 30 L23 27 Z" fill="#F59E0B" />
        <circle cx="350" cy="50" r="5" fill="#10B981" />
    </svg>
);
