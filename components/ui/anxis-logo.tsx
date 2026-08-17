'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AnxisIconProps {
  size?: number
  className?: string
}

export function AnxisIcon({ size = 32, className }: AnxisIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 drop-shadow-sm', className)}
    >
      <defs>
        {/* Ray 1: Top-Left (Orange to Amber) */}
        <linearGradient id="anxisRayOrange" x1="40" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#FFAA00" />
        </linearGradient>

        {/* Ray 2: Top-Right (Emerald to Mint) */}
        <linearGradient id="anxisRayGreen" x1="160" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C968" />
          <stop offset="100%" stopColor="#009B4D" />
        </linearGradient>

        {/* Ray 3: Bottom-Left (Lime to Yellow) */}
        <linearGradient id="anxisRayLime" x1="40" y1="160" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C4E000" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>

        {/* Ray 4: Bottom-Right (Cyan to Electric Blue) */}
        <linearGradient id="anxisRayBlue" x1="160" y1="160" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="#0066EE" />
        </linearGradient>
      </defs>

      {/* Top-Left Ray */}
      <path
        d="M 46 46 C 41 51, 44 60, 52 70 L 88 95 C 93 98, 98 94, 96 89 L 75 51 C 67 38, 54 38, 46 46 Z"
        fill="url(#anxisRayOrange)"
      />

      {/* Top-Right Ray */}
      <path
        d="M 154 46 C 159 51, 156 60, 148 70 L 112 95 C 107 98, 102 94, 104 89 L 125 51 C 133 38, 146 38, 154 46 Z"
        fill="url(#anxisRayGreen)"
      />

      {/* Bottom-Left Ray */}
      <path
        d="M 46 154 C 41 149, 44 140, 52 130 L 88 105 C 93 102, 98 106, 96 111 L 75 149 C 67 162, 54 162, 46 154 Z"
        fill="url(#anxisRayLime)"
      />

      {/* Bottom-Right Ray */}
      <path
        d="M 154 154 C 159 149, 156 140, 148 130 L 112 105 C 107 102, 102 106, 104 111 L 125 149 C 133 162, 146 162, 154 154 Z"
        fill="url(#anxisRayBlue)"
      />
    </svg>
  )
}

interface AnxisLogoProps {
  size?: 'sm' | 'md' | 'lg'
  theme?: 'dark' | 'light'
  className?: string
}

export function AnxisLogo({ size = 'md', theme = 'light', className }: AnxisLogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'md' ? 30 : 38
  const textSize = size === 'sm' ? 'text-lg tracking-wider' : size === 'md' ? 'text-xl tracking-widest' : 'text-2xl tracking-widest'

  return (
    <div className={cn('flex items-center gap-2.5 select-none group', className)}>
      <AnxisIcon size={iconSize} className="transition-transform duration-300 group-hover:scale-105" />
      <span
        className={cn(
          'font-black font-heading leading-none',
          textSize,
          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
        )}
      >
        ANXIS
      </span>
    </div>
  )
}
