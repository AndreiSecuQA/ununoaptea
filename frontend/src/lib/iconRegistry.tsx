// Inline SVG icon set — line-art style, 1px stroke. Kept tiny and uniform.

import type { FC, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

// --- Work ---
const Rocket: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M4 15l4 4M9 20l-3-3-3 3v-6l6-6 6 6-6 6z" />
    <path d="M14 9l7-7-1 5-5 1z" />
  </svg>
);
const Target: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);
const Lightbulb: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a6 6 0 0 0-4-10z" />
  </svg>
);
const Briefcase: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </svg>
);
const Flame: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4-1 3 2 3 2 1 0-2-2-3 0-6z" />
  </svg>
);
const Pen: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M14 4l6 6-12 12H2v-6z" />
    <path d="M13 5l6 6" />
  </svg>
);

// --- Rest ---
const Moon: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </svg>
);
const Cloud: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.7-.8A4.5 4.5 0 0 1 17.5 18H7z" />
  </svg>
);
const Leaf: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M5 21c0-9 7-16 16-16-1 9-7 16-16 16z" />
    <path d="M5 21c4-4 8-8 12-12" />
  </svg>
);
const Teacup: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9h14v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
    <path d="M18 10h2a2 2 0 0 1 0 4h-2M7 3c.5 1-0.5 2 0 3M11 3c.5 1-.5 2 0 3" />
  </svg>
);
const Bath: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h18v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
    <path d="M6 12V6a2 2 0 0 1 4 0M3 19l-1 2M21 19l1 2" />
  </svg>
);
const Butterfly: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 6v13" />
    <path d="M12 8c-2-3-5-3-7-1s-1 5 1 6c-2 1-3 4 0 6 3 1 5-2 6-4" />
    <path d="M12 8c2-3 5-3 7-1s1 5-1 6c2 1 3 4 0 6-3 1-5-2-6-4" />
  </svg>
);

// --- Reflection ---
const Candle: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M8 9h8v12H8zM12 9V6" />
    <path d="M12 3c1 2 2 2 2 3s-1 2-2 2-2-1-2-2 1-1 2-3z" />
  </svg>
);
const Spiral: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 12a3 3 0 1 0 3 3 6 6 0 1 0-6-6 9 9 0 1 0 9 9" />
  </svg>
);
const Feather: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M20 4a9 9 0 0 0-12 12L4 20l4 .5L20 8zM13 11l-7 7M17 6l-6 6" />
  </svg>
);
const Key: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="7" cy="15" r="4" />
    <path d="M10 14l10-10M14 8l2 2M17 5l2 2" />
  </svg>
);
const Meditation: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M5 21c0-4 3-6 7-6s7 2 7 6" />
    <path d="M5 17c-2 0-3-1-3-2s1-2 3-2M19 17c2 0 3-1 3-2s-1-2-3-2" />
  </svg>
);

// --- Celebration ---
const Sparkle: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </svg>
);
const Gift: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="9" width="18" height="12" rx="1" />
    <path d="M12 9v12M3 13h18M7 9a3 3 0 1 1 2-5c1 0 2 2 3 5 1-3 2-5 3-5a3 3 0 1 1 2 5" />
  </svg>
);
const Heart: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
  </svg>
);
const Balloon: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="9" rx="6" ry="7" />
    <path d="M12 16v4M11 20c0-2 2-2 2-4" />
  </svg>
);
const Cake: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="11" width="18" height="9" rx="1" />
    <path d="M3 15c2 2 4 2 6 0s4-2 6 0 4 2 6 0" />
    <path d="M8 8V5M12 8V4M16 8V5" />
  </svg>
);

// --- Nature / Other ---
const Sun: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" />
  </svg>
);
const Mountain: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M3 20l6-10 4 6 3-4 5 8H3z" />
  </svg>
);
const Tree: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2L5 12h4l-5 7h16l-5-7h4L12 2zM12 19v3" />
  </svg>
);
const Flower: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2c3 2 3 6 0 8-3-2-3-6 0-8zM12 22c-3-2-3-6 0-8 3 2 3 6 0 8zM2 12c2-3 6-3 8 0-2 3-6 3-8 0zM22 12c-2 3-6 3-8 0 2-3 6-3 8 0z" />
  </svg>
);
const Compass: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 15.5L10.5 10 16 8l-2 5.5z" />
  </svg>
);
const Star: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2l2.7 6.8 7.3.6-5.5 4.8 1.8 7.1L12 17.7 5.7 21.3l1.8-7.1L2 9.4l7.3-.6z" />
  </svg>
);
const Bird: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M16 7a3 3 0 0 1 3 3c0 5-3 9-9 9-4 0-7-3-7-6 2 1 4 1 6 0-2-1-3-3-3-5s2-4 4-4c2 0 3 1 4 2z" />
    <circle cx="17" cy="8" r="0.5" fill="currentColor" />
  </svg>
);
const Wheat: FC<IconProps> = (p) => (
  <svg {...base} {...p}>
    <path d="M12 22V7" />
    <path d="M12 7c-2 0-3-1-3-3 2 0 3 1 3 3zM12 7c2 0 3-1 3-3-2 0-3 1-3 3z" />
    <path d="M12 12c-2 0-3-1-3-3 2 0 3 1 3 3zM12 12c2 0 3-1 3-3-2 0-3 1-3 3z" />
    <path d="M12 17c-2 0-3-1-3-3 2 0 3 1 3 3zM12 17c2 0 3-1 3-3-2 0-3 1-3 3z" />
  </svg>
);

export type IconId =
  | "rocket" | "target" | "lightbulb" | "briefcase" | "flame" | "pen"
  | "moon" | "cloud" | "leaf" | "teacup" | "bath" | "butterfly"
  | "candle" | "spiral" | "feather" | "key" | "meditation"
  | "sparkle" | "gift" | "heart" | "balloon" | "cake"
  | "sun" | "mountain" | "tree" | "flower" | "compass" | "star" | "bird" | "wheat";

export const ICONS: Record<IconId, FC<IconProps>> = {
  rocket: Rocket,
  target: Target,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  flame: Flame,
  pen: Pen,
  moon: Moon,
  cloud: Cloud,
  leaf: Leaf,
  teacup: Teacup,
  bath: Bath,
  butterfly: Butterfly,
  candle: Candle,
  spiral: Spiral,
  feather: Feather,
  key: Key,
  meditation: Meditation,
  sparkle: Sparkle,
  gift: Gift,
  heart: Heart,
  balloon: Balloon,
  cake: Cake,
  sun: Sun,
  mountain: Mountain,
  tree: Tree,
  flower: Flower,
  compass: Compass,
  star: Star,
  bird: Bird,
  wheat: Wheat,
};

export const ICON_GROUPS: Array<{ label: string; icons: IconId[] }> = [
  { label: "Muncă", icons: ["rocket", "target", "lightbulb", "briefcase", "flame", "pen"] },
  { label: "Odihnă", icons: ["moon", "cloud", "leaf", "teacup", "bath", "butterfly"] },
  { label: "Reflecție", icons: ["candle", "spiral", "feather", "key", "meditation"] },
  { label: "Celebrare", icons: ["sparkle", "gift", "heart", "balloon", "cake"] },
  { label: "Natură", icons: ["sun", "mountain", "tree", "flower", "compass", "star", "bird", "wheat"] },
];

export function Icon({ id, ...rest }: { id: IconId } & IconProps) {
  const C = ICONS[id];
  if (!C) return null;
  return <C {...rest} />;
}
