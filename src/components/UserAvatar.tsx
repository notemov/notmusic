import React from 'react';
import { User, Headphones, Disc, Flame, Moon, Zap } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface UserAvatarProps {
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, size = 'md', className = '' }) => {
  const { userProfile } = usePlayer();
  const currentAvatar = avatar || userProfile.avatar;

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-full text-xs',
    md: 'w-9 h-9 rounded-full text-sm',
    lg: 'w-14 h-14 rounded-2xl text-lg',
    xl: 'w-24 h-24 rounded-3xl text-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-7 h-7',
    xl: 'w-12 h-12',
  };

  if (currentAvatar.startsWith('http://') || currentAvatar.startsWith('https://') || currentAvatar.startsWith('data:image')) {
    return (
      <div className={`${sizeClasses[size]} overflow-hidden shadow-md border border-white/10 ${className}`}>
        <img src={currentAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  switch (currentAvatar) {
    case 'cyber-neon':
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center text-white shadow-md ${className}`}>
          <Zap className={iconSizes[size]} />
        </div>
      );
    case 'vinyl-vintage':
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md ${className}`}>
          <Disc className={iconSizes[size]} />
        </div>
      );
    case 'chill-lofi':
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md ${className}`}>
          <Moon className={iconSizes[size]} />
        </div>
      );
    case 'rock-star':
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md ${className}`}>
          <Flame className={iconSizes[size]} />
        </div>
      );
    case 'dj-cool':
    default:
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md ${className}`}>
          <Headphones className={iconSizes[size]} />
        </div>
      );
  }
};
