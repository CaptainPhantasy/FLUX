import React from 'react';
import { cn } from '@/utils/cn';

type BackgroundGradientAnimationProps = {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  interactive?: boolean;
};

/**
  Inspired by Aceternity UI Background Gradient Animation:
  https://ui.aceternity.com/components/background-gradient-animation
 */
export function BackgroundGradientAnimation({
  children,
  className,
  containerClassName,
  gradientBackgroundStart = 'rgb(108, 0, 162)',
  gradientBackgroundEnd = 'rgb(0, 17, 82)',
  firstColor = '18, 113, 255',
  secondColor = '221, 74, 255',
  thirdColor = '100, 220, 255',
  fourthColor = '200, 50, 50',
  fifthColor = '180, 180, 50',
  pointerColor = '140, 100, 255',
  size = '80%',
  blendingValue = 'hard-light',
  interactive = true,
}: BackgroundGradientAnimationProps) {
  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{
        background: `radial-gradient(circle at top left, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          filter: `blur(60px) saturate(120%)`,
          mixBlendMode: blendingValue as any,
        }}
      >
        <div
          className="absolute animate-[moveVertical_30s_ease_infinite]"
          style={{
            width: size,
            height: size,
            left: '10%',
            top: '-20%',
            background: `radial-gradient(circle, rgba(${firstColor},0.6) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute animate-[moveInCircle_20s_reverse_infinite]"
          style={{
            width: size,
            height: size,
            left: '60%',
            top: '0%',
            background: `radial-gradient(circle, rgba(${secondColor},0.5) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute animate-[moveInCircle_40s_linear_infinite]"
          style={{
            width: size,
            height: size,
            left: '30%',
            top: '20%',
            background: `radial-gradient(circle, rgba(${thirdColor},0.4) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute animate-[moveHorizontal_40s_ease_infinite]"
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '40%',
            background: `radial-gradient(circle, rgba(${fourthColor},0.25) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute animate-[moveInCircle_20s_ease_infinite]"
          style={{
            width: size,
            height: size,
            left: '20%',
            top: '60%',
            background: `radial-gradient(circle, rgba(${fifthColor},0.2) 0%, transparent 60%)`,
          }}
        />
      </div>

      {interactive && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(${pointerColor},0.15), transparent 40%)`,
          }}
        />
      )}

      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  );
}

