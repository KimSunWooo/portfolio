import Icon from "./Icon";

interface ButtonProps {
  children?: React.ReactNode;
  variant?: "solid" | "outline" | "text" | "icon";
  icon?: "arrow" | "plus" | "search" | "bag" | "close";
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
}

export default function Button({ children, variant = "text", icon, onClick, type = "button", ariaLabel }: ButtonProps) {
  const variants = {
    solid: "min-h-[46px] bg-[#151515] px-[22px] text-[12px] tracking-[0.08em] text-white",
    outline: "min-h-[46px] border border-[#151515] px-[22px] text-[12px] tracking-[0.08em]",
    text: "px-0 py-[3px] text-[12px] tracking-[0.06em]",
    icon: "h-9 w-9 rounded-full",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-60 ${variants[variant]}`}
      onClick={onClick}
      type={type}
      aria-label={ariaLabel}
    >
      {children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  );
}
