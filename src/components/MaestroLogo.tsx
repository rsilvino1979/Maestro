import React from 'react';

interface MaestroLogoProps {
  variant?: 'icon' | 'full' | 'large';
  className?: string;
  theme?: 'light' | 'dark';
}

export default function MaestroLogo({ variant = 'full', className = '', theme = 'dark' }: MaestroLogoProps) {
  // SVG Graphic: 4 vertical columns with a thick rising check-line that has a top-right arrow
  const renderGraphic = (sizeClass: string) => (
    <svg
      viewBox="0 0 120 100"
      className={`${sizeClass} fill-none select-none`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 4 Vertical blue bars with flat tops, stepped from left to right */}
      {/* Bar 1: Leftmost, shortest */}
      <rect
        x="24"
        y="62"
        width="11"
        height="24"
        rx="1"
        fill="#17537D"
        className="opacity-95"
      />
      {/* Bar 2: Medium-short */}
      <rect
        x="42"
        y="46"
        width="11"
        height="40"
        rx="1"
        fill="#17537D"
        className="opacity-95"
      />
      {/* Bar 3: Medium-tall */}
      <rect
        x="60"
        y="35"
        width="11"
        height="51"
        rx="1"
        fill="#17537D"
        className="opacity-95"
      />
      {/* Bar 4: Tallest */}
      <rect
        x="78"
        y="20"
        width="11"
        height="66"
        rx="1"
        fill="#17537D"
        className="opacity-95"
      />

      {/* The white negative gap that outlines the trendline intersection */}
      <path
        d="M 12 70 L 48 26 L 68 51 L 110 7"
        stroke="#0f172a" // Matches bg-slate-900 / dark backgrounds
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-slate-900 stroke-slate-950 transition-colors duration-300"
      />

      {/* Main thick trendline in dark blue/teal matching image */}
      <path
        d="M 12 70 L 48 26 L 68 51 L 110 7"
        stroke="#1A6496"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow Head pointing top right */}
      <path
        d="M 91 8 L 111 6 L 109 26"
        stroke="#1A6496"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderGraphic('w-full h-full')}
      </div>
    );
  }

  const isLarge = variant === 'large';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Graphic */}
      {renderGraphic(isLarge ? 'w-24 h-20' : 'w-18 h-15')}

      {/* Title 'MAESTRO' */}
      <h1
        className={`font-black uppercase tracking-[0.25em] text-slate-100 font-display mt-2 whitespace-nowrap leading-none ${
          isLarge ? 'text-lg md:text-xl tracking-[0.3em] font-extrabold' : 'text-sm'
        }`}
      >
        Maestro
      </h1>

      {/* Subtitle 'Value Delivery & Growth' */}
      <p
        className={`font-mono font-medium text-slate-450 tracking-wide mt-1 whitespace-nowrap leading-none ${
          isLarge ? 'text-[9.5px]' : 'text-[7.5px]'
        }`}
      >
        Value Delivery &amp; Growth
      </p>
    </div>
  );
}
