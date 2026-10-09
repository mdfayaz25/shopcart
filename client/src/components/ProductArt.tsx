import { useState } from 'react';
import {
  Activity, Aperture, AudioLines, Backpack, BatteryCharging, Camera, Coffee, Gamepad2, Glasses, Headphones, Headset,
  Keyboard, Lamp, Laptop, Monitor, Mouse, Package, Speaker, Video, Watch, Wind, Zap, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const PRODUCT_ICONS: Record<string, LucideIcon> = {
  headphones: Headphones, earbuds: AudioLines, speaker: Speaker, watch: Watch, activity: Activity, glasses: Glasses,
  laptop: Laptop, keyboard: Keyboard, mouse: Mouse, monitor: Monitor, camera: Camera, video: Video, aperture: Aperture,
  gamepad: Gamepad2, headset: Headset, battery: BatteryCharging, backpack: Backpack, charger: Zap, lamp: Lamp,
  coffee: Coffee, wind: Wind, package: Package,
};

type Props = { icon?: string; tone?: string; imageUrl?: string; name: string; size?: 'sm' | 'md' | 'lg'; className?: string };

/**
 * Product visual. Uses the product photo when one is set, otherwise an illustrated tile
 * built from the product's icon and brand tone, so the catalog never shows a broken image.
 */
export function ProductArt({ icon = 'package', tone = '#FF5A1F', imageUrl, name, size = 'md', className }: Props) {
  const [failed, setFailed] = useState(false);
  const Icon = PRODUCT_ICONS[icon] ?? Package;
  const iconSize = { sm: 'h-6 w-6', md: 'h-[38%] w-[38%]', lg: 'h-[34%] w-[34%]' }[size];

  if (imageUrl && !failed) {
    return (
      <div className={cn('relative overflow-hidden bg-surface-2', className)}>
        <img src={imageUrl} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn('relative isolate grid place-items-center overflow-hidden', className)}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${tone}26, transparent 60%), linear-gradient(160deg, ${tone}14, ${tone}08 60%, #ffffff00), rgb(var(--surface-2))` }}
    >
      {size !== 'sm' && (
        <>
          <span className="absolute -right-[18%] -top-[18%] aspect-square w-[70%] rounded-full opacity-[.14]" style={{ background: tone }} />
          <span className="absolute -bottom-[30%] -left-[10%] aspect-square w-[60%] rounded-full border-[10px] opacity-[.08]" style={{ borderColor: tone }} />
          <span className="absolute bottom-[14%] left-1/2 h-[6%] w-[44%] -translate-x-1/2 rounded-[50%] bg-black/10 blur-md" />
        </>
      )}
      <Icon className={cn('relative drop-shadow-[0_10px_18px_rgba(0,0,0,.18)]', iconSize)} style={{ color: tone }} strokeWidth={size === 'sm' ? 1.8 : 1.25} />
    </div>
  );
}
