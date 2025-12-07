import React from 'react';
import { WavyBackground } from './ui/WavyBackground';
import { cn } from '@/lib/utils';

const FluxHero: React.FC = () => {
  return (
    <WavyBackground 
      className="max-w-5xl mx-auto pb-20 md:pb-32 px-4 flex flex-col items-center justify-center text-center"
      containerClassName="min-h-screen bg-[#020617]"
      colors={[
        "#a855f7", // Purple
        "#d946ef", // Fuchsia
        "#06b6d4", // Cyan
        "#8b5cf6", // Violet
        "#22d3ee", // Light Blue
      ]}
      waveWidth={50}
      blur={10}
      speed="fast"
      waveOpacity={0.5}
    >
      {/* Logo removed as requested. Only tagline remains. */}
      
      <p className={cn(
        "text-base md:text-xl lg:text-2xl",
        "font-medium text-white/80",
        "max-w-2xl mx-auto leading-relaxed",
        "animate-fade-in-up"
      )}>
        The AI-native PM for teams who ship fast.
      </p>

    </WavyBackground>
  );
};

export default FluxHero;