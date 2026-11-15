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
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
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
        className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
      />
    </div>
  );
};
