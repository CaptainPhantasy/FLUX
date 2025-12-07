import React, { useState } from 'react';
import { Integration } from '../types';
import { Check, ArrowRight, Settings } from 'lucide-react';

interface IntegrationCardProps {
  integration: Integration;
  onToggle: (integration: Integration) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onToggle,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic styles for the glow effect based on brand color
  const glowStyle = isHovered
    ? {
        boxShadow: `0 20px 60px -12px ${integration.brandColor}60, 0 12px 30px -8px ${integration.brandColor}30`,
        borderColor: `${integration.brandColor}80`,
        transform: 'translateY(-6px)',
      }
    : {};

  return (
    <div
      className="group relative flex flex-col bg-card rounded-2xl border border-border/60 transition-all duration-300 ease-out h-[260px] overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1.5"
      style={glowStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header: Icon & Status */}
      <div className="p-6 flex-1 flex flex-col items-center text-center z-10">
        <div 
          className={`w-16 h-16 mb-4 rounded-2xl p-3 bg-muted border border-border shadow-md transition-all duration-300 ${!integration.isConnected && !isHovered ? 'grayscale opacity-70' : 'grayscale-0 opacity-100'}`}
        >
          {integration.icon}
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
          {integration.name}
        </h3>
        
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 px-2">
          {integration.description}
        </p>
      </div>

      {/* Card Footer: Action Area */}
      <div className="p-4 mt-auto border-t border-border/60 bg-muted/40 group-hover:bg-card transition-colors">
        <button
          onClick={() => onToggle(integration)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            integration.isConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-card text-foreground border border-border hover:border-violet-200 hover:shadow-md'
          }`}
        >
          <span className="flex items-center gap-2">
            {integration.isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </>
            ) : (
              'Connect'
            )}
          </span>

          {integration.isConnected ? (
            <Settings size={16} className="text-emerald-600" />
          ) : (
            <ArrowRight size={16} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          )}
        </button>
      </div>

      {/* Subtle Background Gradient for "Lift" effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-b from-transparent to-slate-100" 
        aria-hidden="true"
      />
    </div>
  );
};