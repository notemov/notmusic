import React from 'react';
import { Music, Disc, Headphones, Sparkles, Flame, Activity } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '', showText = false }) => {
  const { appSettings } = usePlayer();
  const icon = appSettings.appIcon;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // If preset icon chosen other than official
  if (icon === 'vinyl-flame') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ${className}`}>
        <Flame className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }
  if (icon === 'cosmic-sound') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ${className}`}>
        <Sparkles className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }
  if (icon === 'cyber-headphones') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ${className}`}>
        <Headphones className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }
  if (icon === 'minimal-pulse') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-rose-500 via-pink-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-rose-500/20 ${className}`}>
        <Activity className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }

  // Official Brand Logo (from uploaded image)
  return (
    <div className={`relative ${sizeClasses[size]} overflow-hidden shadow-xl border border-white/10 bg-[#0d0f17] flex items-center justify-center group ${className}`}>
      <img
        src="/logo.png"
        alt="NotMusic Logo"
        className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};
