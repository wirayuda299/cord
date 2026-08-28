import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** First two characters of `name`, upper-cased, e.g. "wirayuda" -> "WI". */
export function getInitials(name: string, fallback = "??") {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 2).toUpperCase();
}

/** Deterministic HSL background for a fallback avatar, derived from `seed` (e.g. a user id). */
export function avatarColorFromSeed(seed: string) {
  const hue = seed
    .split("")
    .reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue} 60% 40%)`;
}

type AvatarProps = {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: number;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
  indicator?: "online" | "offline";
  className?: string;
};

export function Avatar({
  src,
  alt,
  fallback,
  size = 36,
  fallbackClassName,
  fallbackStyle,
  indicator,
  className,
}: AvatarProps) {
  const indicatorSize = Math.max(Math.round(size / 3), 10);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full rounded-full flex items-center justify-center text-xs font-semibold text-white select-none",
            fallbackClassName,
          )}
          style={fallbackStyle}
        >
          {fallback}
        </div>
      )}
      {indicator && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#313338]",
            indicator === "online" ? "bg-[#23a559]" : "bg-zinc-600",
          )}
          style={{ width: indicatorSize, height: indicatorSize }}
        />
      )}
    </div>
  );
}
