"use client";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "scanline";
}

export function AnimateIn({ children, className = "", delay = 0, variant = "fadeUp" }: AnimateInProps) {
  const animationStyle = variant === "scanline"
    ? { animation: `scanline 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both` }
    : { animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${100 + delay}ms both` };

  return (
    <div className={className} style={animationStyle}>
      {children}
    </div>
  );
}