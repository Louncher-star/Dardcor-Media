'use client';

import { useState } from 'react';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isGroup?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  name,
  size = 'md',
  isGroup = false,
  isOnline = false,
  className,
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const hasValidImage = src && !imageError;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-full flex items-center justify-center text-white font-semibold overflow-visible select-none shrink-0 cursor-pointer transition-transform hover:scale-105',
        sizeClasses[size],
        className
      )}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#6d28d9] to-[#4f46e5] shadow-sm">
        {hasValidImage ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : isGroup ? (
          <Users size={iconSizes[size]} className="text-white/80" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {isOnline && !isGroup && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 bg-[#a855f7] border-2 border-[var(--wa-bg-sidebar)] rounded-full z-10 shadow-sm shadow-purple-500/50"
          title="Online"
        />
      )}
    </div>
  );
}
