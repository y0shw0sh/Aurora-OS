import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  level?: "low" | "mid" | "high" | "titlebar";
  border?: boolean;
  shadow?: boolean;
  onClick?: () =>void;
}

export default function GlassPanel({
  children,
  className,
  style,
  level = "mid",
  border = true,
  shadow = true,
  onClick,
}: GlassPanelProps) {

  const backgrounds = {
    low: "rgba(255,255,255,0.10)",
    mid: "rgba(255,255,255,0.18)",
    high: "rgba(255,255,255,0.24)",
    titlebar: "rgba(255,255,255,0.16)",
  };

  const blurs = {
    low: "blur(10px) saturate(180%)",
    mid: "blur(18px) saturate(190%)",
    high: "blur(24px) saturate(200%)",
    titlebar: "blur(22px) saturate(200%)",
  };

  const borders = {
    low: "rgba(255,255,255,.28)",
    mid: "rgba(255,255,255,.35)",
    high: "rgba(255,255,255,.42)",
    titlebar: "rgba(255,255,255,.35)",
  };

  return (
    <div
      onClick={onClick}
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background: backgrounds[level],

        backdropFilter: blurs[level],
        WebkitBackdropFilter: blurs[level],

        border: border ? `2px solid ${borders[level]}` : undefined,

        boxShadow: shadow
          ? `
            inset 0 0 8px rgba(255,255,255,.55),
            inset 0 1px 1px rgba(255,255,255,.85),
            inset 0 -1px 1px rgba(255,255,255,.08),
            0 8px 24px rgba(0,0,0,.18)
          `
          : undefined,

        ...style,
      }}
    >
      {children}
    </div>
  );
}