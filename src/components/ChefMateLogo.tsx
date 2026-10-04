import React from 'react';

interface Props {
  size?: number | string;
  className?: string;
  isHopping?: boolean;
  isBlinking?: boolean;
  isCheeksGlowing?: boolean;
}

export const ChefMateLogo: React.FC<Props> = ({
  size = 48,
  className = '',
  isHopping = false,
  isBlinking = false,
  isCheeksGlowing = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      {/* Orange rounded-square icon background */}
      <rect width="100" height="100" rx="24" fill="#FF5500" />

      {/* Chef Hat Group (with optional hop animation) */}
      <g
        className={`transition-transform duration-300 ${
          isHopping ? '-translate-y-2' : 'translate-y-0'
        }`}
      >
        {/* Puffy Chef Hat Top in White */}
        {/* Left Puff */}
        <circle cx="36" cy="46" r="14" fill="#FFFFFF" />
        {/* Center Puff (higher) */}
        <circle cx="50" cy="36" r="16" fill="#FFFFFF" />
        {/* Right Puff */}
        <circle cx="64" cy="46" r="14" fill="#FFFFFF" />
        {/* Hat Dome Body filler */}
        <path
          d="M 30 52 C 30 46 70 46 70 52 L 68 64 C 68 64 32 64 32 64 Z"
          fill="#FFFFFF"
        />

        {/* Flat Hat Band at bottom in soft cream/peach */}
        <rect
          x="30"
          y="63"
          width="40"
          height="12"
          rx="3.5"
          fill="#FFE2D1"
        />

        {/* Friendly Face on the hat */}
        {/* Left Eye */}
        <ellipse
          cx="43"
          cy="51"
          rx="2.6"
          ry={isBlinking ? 0.4 : 2.6}
          fill="#1C212D"
          className="transition-all duration-150"
        />
        {/* Right Eye */}
        <ellipse
          cx="57"
          cy="51"
          rx="2.6"
          ry={isBlinking ? 0.4 : 2.6}
          fill="#1C212D"
          className="transition-all duration-150"
        />

        {/* Two Soft Peach Cheeks */}
        <circle
          cx="36"
          cy="54.5"
          r={isCheeksGlowing ? 4.5 : 3.4}
          fill="#FFAF94"
          className={`transition-all duration-300 ${
            isCheeksGlowing ? 'opacity-100 filter drop-shadow-[0_0_3px_#FFAF94]' : 'opacity-85'
          }`}
        />
        <circle
          cx="64"
          cy="54.5"
          r={isCheeksGlowing ? 4.5 : 3.4}
          fill="#FFAF94"
          className={`transition-all duration-300 ${
            isCheeksGlowing ? 'opacity-100 filter drop-shadow-[0_0_3px_#FFAF94]' : 'opacity-85'
          }`}
        />
      </g>
    </svg>
  );
};
