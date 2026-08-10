'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import * as Icons from '@hugeicons/core-free-icons'

interface IconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

// Fallback icon map for dynamic icon lookup
const ICON_LOOKUP: Record<string, any> = {
  Globe: Icons.Globe02Icon,
  Zap: Icons.FlashIcon,
  ShoppingBag: Icons.ShoppingBag01Icon,
  RefreshCw: Icons.RefreshIcon,
  Code2: Icons.CodeIcon,
  Cpu: Icons.CpuIcon,
  ShieldCheck: Icons.ShieldCheck,
  Smartphone: Icons.SmartPhone01Icon,
  Gauge: Icons.CircleGaugeIcon,
  Layers: Icons.Layers01Icon,
  Sparkles: Icons.SparklesIcon,
  Check: Icons.CheckmarkCircle01Icon,
  ArrowRight: Icons.ArrowRight01Icon,
  ArrowUpRight: Icons.ArrowUpRight01Icon,
  MessageSquare: Icons.Comment01Icon,
  Mail: Icons.Mail01Icon,
  Phone: Icons.CallIcon,
  MapPin: Icons.Location01Icon,
  Lock: Icons.LockIcon,
  Menu: Icons.Menu01Icon,
  X: Icons.Cancel01Icon,
  Filter: Icons.FilterIcon,
  ExternalLink: Icons.Link01Icon,
  Touchpad: Icons.CursorPointer01Icon,
  Terminal: Icons.TerminalIcon,
}

export function Icon({ name, size = 24, className = '', color }: IconProps) {
  const iconData = ICON_LOOKUP[name] || Icons[name as keyof typeof Icons] || Icons.Globe02Icon

  return <HugeiconsIcon icon={iconData} size={size} className={className} color={color} />
}

export { HugeiconsIcon, Icons }
