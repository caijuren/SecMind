"use client";

export function AnimateIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={className}
      style={{
        animation: 'fadeInUp 0.6s ease-out ' + (100 + delay) + 'ms both',
      }}
    >
      {children}
    </div>
  );
}