import React from 'react';
import {
  Zap,
  Droplets,
  Hammer,
  PaintRoller,
  Wind,
  Refrigerator,
  Waves,
  Sparkles,
  GlassWater,
  Wrench,
} from 'lucide-react';

export function ServiceIcon({ iconName, className = 'w-6 h-6' }: { iconName: string; className?: string }) {
  switch (iconName) {
    case 'Zap':
      return <Zap className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Hammer':
      return <Hammer className={className} />;
    case 'PaintRoller':
      return <PaintRoller className={className} />;
    case 'Wind':
      return <Wind className={className} />;
    case 'Refrigerator':
      return <Refrigerator className={className} />;
    case 'Waves':
      return <Waves className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'GlassWater':
      return <GlassWater className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

/**
 * Emergent Reference Rounded-Square Logo Mark:
 * Deep Teal (#087F78) rounded square with a crisp white professional tools (wrench & hammer) icon.
 */
export function ManaExpertsLogoMark({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-[14px] bg-[#087F78] shadow-sm flex items-center justify-center shrink-0 select-none`}
      aria-label="Mana Experts Logo"
    >
      <Wrench className="w-[54%] h-[54%] text-white stroke-[2.2]" />
    </div>
  );
}
