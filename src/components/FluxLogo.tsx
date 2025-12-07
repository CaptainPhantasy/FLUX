// =====================================
// FLUX - Logo Component
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
import React from 'react';

interface FluxLogoProps {
  className?: string;
  variant?: 'transparent' | 'full' | 'dark' | 'nopadding';
}

const logoVariants = {
  transparent: '/flux-logo-transparent.png',
  full: '/flux-logo-full.png',
  dark: '/flux-logo-dark.jpeg',
  nopadding: '/flux-logo-nopadding.jpeg',
};

export const FluxLogo: React.FC<FluxLogoProps> = ({ className, variant = 'transparent' }) => {
  return (
    <img 
      src={logoVariants[variant]} 
      alt="Flux Logo" 
      className={className}
    />
  );
};
