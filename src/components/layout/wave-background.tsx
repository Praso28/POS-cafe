"use client";

import React from "react";

interface WaveBackgroundProps {
    children?: React.ReactNode;
    className?: string;
}

/**
 * WaveBackground - Reusable wave gradient background wrapper
 * Provides the colorful wave gradient that appears behind content
 */
export function WaveBackground({ children, className = "" }: WaveBackgroundProps) {
    return (
        <div className={`min-h-screen relative ${className}`} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Wave Decoration Layer */}
            <WaveBackgroundInline />
            {/* Content */}
            {children}
        </div>
    );
}

/**
 * WaveBackgroundInline - Just the SVG waves without wrapper
 * Use when you need to add waves to an existing layout
 */
export function WaveBackgroundInline() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            {/* Left wave cluster - Blue/Teal/Mint */}
            <svg
                className="absolute left-0 top-0 h-full"
                style={{ width: '60%' }}
                viewBox="0 0 600 800"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="inlineWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                        <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.45" />
                        <stop offset="65%" stopColor="#5eead4" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                    </linearGradient>
                </defs>
                {/* Primary wave */}
                <path
                    d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z"
                    fill="url(#inlineWaveLeft)"
                />
                {/* Secondary wave */}
                <path
                    d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z"
                    fill="url(#inlineWaveLeft)"
                    opacity="0.6"
                />
                {/* Tertiary wave */}
                <path
                    d="M80,0 C180,200 220,450 130,650 C40,850 150,920 80,1000 L0,1000 L0,0 Z"
                    fill="url(#inlineWaveLeft)"
                    opacity="0.35"
                />
            </svg>

            {/* Right wave cluster - Pink/Purple/Lavender */}
            <svg
                className="absolute right-0 top-0 h-full"
                style={{ width: '60%' }}
                viewBox="0 0 600 800"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="inlineWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                        <stop offset="35%" stopColor="#e879f9" stopOpacity="0.4" />
                        <stop offset="65%" stopColor="#d8b4fe" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                    </linearGradient>
                </defs>
                {/* Primary wave */}
                <path
                    d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z"
                    fill="url(#inlineWaveRight)"
                />
                {/* Secondary wave */}
                <path
                    d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z"
                    fill="url(#inlineWaveRight)"
                    opacity="0.6"
                />
                {/* Tertiary wave */}
                <path
                    d="M520,0 C420,200 380,450 470,650 C560,850 450,920 520,1000 L600,1000 L600,0 Z"
                    fill="url(#inlineWaveRight)"
                    opacity="0.35"
                />
            </svg>

            {/* Bottom wave accent - connecting element */}
            <svg
                className="absolute bottom-0 left-0 w-full"
                style={{ height: '45%' }}
                viewBox="0 0 1200 400"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="inlineWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
                        <stop offset="30%" stopColor="#a5f3fc" stopOpacity="0.2" />
                        <stop offset="70%" stopColor="#fae8ff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.3" />
                    </linearGradient>
                </defs>
                <path
                    d="M0,400 C150,320 350,360 500,300 C650,240 800,280 950,260 C1100,240 1200,320 1200,280 L1200,400 L0,400 Z"
                    fill="url(#inlineWaveBottom)"
                />
                <path
                    d="M0,400 C200,340 400,380 600,330 C800,280 1000,350 1200,310 L1200,400 L0,400 Z"
                    fill="url(#inlineWaveBottom)"
                    opacity="0.5"
                />
            </svg>
        </div>
    );
}
