type IconName = "menu" | "search" | "bag" | "close" | "arrow" | "plus";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, strokeWidth = 1.3 }: IconProps) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "menu": return <svg {...common}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    case "search": return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
    case "bag": return <svg {...common}><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
    case "close": return <svg {...common}><path d="m5 5 14 14M19 5 5 19" /></svg>;
    case "arrow": return <svg {...common}><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  }
}
