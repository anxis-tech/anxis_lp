'use client'

import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'

export interface IconProps {
  icon: any
  size?: number | string
  color?: string
  strokeWidth?: number
  className?: string
  alt?: string
  ariaLabel?: string
  title?: string
}

/**
 * Reusable central Icon component using Hugeicons.
 * Defaults: size = 18, strokeWidth = 1.5, color = 'currentColor'.
 */
export function Icon({
  icon,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.5,
  className = '',
  alt,
  ariaLabel,
  title,
}: IconProps) {
  const isDecorative = !alt && !ariaLabel && !title

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 leading-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
      role={isDecorative ? 'presentation' : 'img'}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={ariaLabel || alt}
      title={title}
    >
      <HugeiconsIcon
        icon={icon}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
      />
    </span>
  )
}
