// @ts-nocheck
"use client";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

/**
 * Wavy Background Component
 * Based on Aceternity UI: https://ui.aceternity.com/components/wavy-background
 * Uses canvas for smooth wave animations
 * 
 * LOCKED WAVE CONFIGURATION (DO NOT CHANGE):
 * - Waves render at vertical center: y = h * 0.5 (50% from top)
 * - Canvas fills full viewport: width = window.innerWidth, height = window.innerHeight
 * - Wave amplitude: noise * 100 (creates ~100px vertical variation)
 * - Waves span full width: x iterates from 0 to canvas width
 * - 5 wave layers with colors cycling through waveColors array
 * - Line width (waveWidth): 50px default
 * - Blur: 10px default
 */

type WavyBackgroundProps = {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  speedFactor?: number;
  [key: string]: any;
};

export function WavyBackground({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  speedFactor = 1,
  ...props
}: WavyBackgroundProps) {
  const noise = createNoise3D();
  let w: number,
    h: number,
    nt: number,
    i: number,
    x: number,
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.0045 * speedFactor;
      case "fast":
        return 0.009 * speedFactor;
      default:
        return 0.0045 * speedFactor;
    }
  };

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    w = ctx.canvas.width = window.innerWidth;
    h = ctx.canvas.height = window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    nt = 0;
    
    window.onresize = function () {
      if (!ctx) return;
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };
    render();
  };

  const waveColors = colors ?? [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#e879f9",
    "#22d3ee",
  ];
  
  const drawWave = (n: number) => {
    if (!ctx) return;
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      // Line thickness increased 200% (50 -> 150)
      ctx.lineWidth = waveWidth || 150;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        // Amplitude reduced 25% (180 -> 135), wave separation at 0.45 for smoother movement
        const y = noise(x / 800, 0.45 * i, nt) * 135;
        ctx.lineTo(x, y + h * 0.5);
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId: number;
  const render = () => {
    if (!ctx) return;
    ctx.fillStyle = backgroundFill || "black";
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(3);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-center",
        containerClassName
      )}
      style={{ 
        margin: 0, 
        padding: 0,
        background: backgroundFill || "black"
      }}
    >
      <canvas
        className="absolute inset-0 z-0 w-full h-full"
        ref={canvasRef}
        id="canvas"
        style={{
          display: "block",
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      />
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export default WavyBackground;
