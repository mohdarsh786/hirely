import React from 'react';

export const DocumentLibraryDoodle = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Bookshelf/Library */}
        <g transform="translate(80, 80)">
            {/* Shelf */}
            <rect x="0" y="120" width="240" height="8" rx="4" fill="#0F172A" />
            
            {/* Books */}
            {/* Book 1 */}
            <rect x="10" y="60" width="35" height="60" rx="3" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            <line x1="15" y1="60" x2="15" y2="120" stroke="#0F172A" strokeWidth="2" />
            
            {/* Book 2 */}
            <rect x="50" y="50" width="30" height="70" rx="3" fill="#F59E0B" stroke="#0F172A" strokeWidth="3" />
            <line x1="54" y1="50" x2="54" y2="120" stroke="#0F172A" strokeWidth="2" />
            
            {/* Book 3 */}
            <rect x="85" y="55" width="38" height="65" rx="3" fill="#10B981" stroke="#0F172A" strokeWidth="3" />
            <line x1="90" y1="55" x2="90" y2="120" stroke="#0F172A" strokeWidth="2" />
            
            {/* Book 4 - Tilted */}
            <g transform="translate(128, 85) rotate(-15)">
                <rect x="0" y="0" width="32" height="50" rx="3" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />
                <line x1="4" y1="0" x2="4" y2="50" stroke="#0F172A" strokeWidth="2" />
            </g>
            
            {/* Book 5 */}
            <rect x="165" y="65" width="35" height="55" rx="3" fill="#8B5CF6" stroke="#0F172A" strokeWidth="3" />
            <line x1="170" y1="65" x2="170" y2="120" stroke="#0F172A" strokeWidth="2" />
            
            {/* Book 6 */}
            <rect x="205" y="70" width="30" height="50" rx="3" fill="#EC4899" stroke="#0F172A" strokeWidth="3" />
            <line x1="209" y1="70" x2="209" y2="120" stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* Character reading */}
        <g transform="translate(50, 180)">
            {/* Head */}
            <circle cx="20" cy="20" r="16" fill="white" stroke="#0F172A" strokeWidth="3" />
            <circle cx="15" cy="18" r="2" fill="#0F172A" />
            <circle cx="25" cy="18" r="2" fill="#0F172A" />
            <path d="M15 24 Q20 26 25 24" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
            
            {/* Body */}
            <rect x="8" y="36" width="24" height="30" rx="12" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
            
            {/* Open book in hands */}
            <g transform="translate(35, 45)">
                <path d="M0 0 L20 0 L20 15 L10 12 L0 15 Z" fill="white" stroke="#0F172A" strokeWidth="2" />
                <line x1="10" y1="0" x2="10" y2="12" stroke="#0F172A" strokeWidth="2" />
                <line x1="3" y1="5" x2="7" y2="5" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="13" y1="5" x2="17" y2="5" stroke="#CBD5E1" strokeWidth="1.5" />
            </g>
        </g>

        {/* Floating sparkles/knowledge */}
        <g transform="translate(280, 100)">
            <path d="M20 10 L22 15 L27 15 L23 19 L25 24 L20 21 L15 24 L17 19 L13 15 L18 15 Z" fill="#FEF08A" stroke="#0F172A" strokeWidth="2" />
        </g>
        
        <circle cx="320" cy="180" r="4" fill="#F59E0B" />
        <circle cx="60" cy="60" r="3" fill="#3B82F6" />
        
        {/* Upload arrow */}
        <g transform="translate(300, 200)">
            <path d="M20 30 L20 10 M10 20 L20 10 L30 20" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
    </svg>
);
