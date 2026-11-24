'use client';

import { useState, useEffect } from 'react';
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

export function isPlaceholderAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return true;
  if (trimmed.includes('photo-1534528741775-53994a69daeb')) return true;
  if (trimmed.includes('images.unsplash.com')) return true;
  return false;
}

/**
 * Avatar default kontak individu WhatsApp (siluet putih di atas lingkaran abu-abu slate #6B7780)
 */
export function WhatsAppDefaultUserAvatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 212 212"
      className={cn('w-full h-full select-none shrink-0', className)}
      aria-hidden="true"
    >
      <circle fill="#6B7780" cx="106" cy="106" r="106" />
      <path
        fill="#FFFFFF"
        d="M106,117.4c18.8,0,34.1-15.3,34.1-34.1c0-18.8-15.3-34.1-34.1-34.1c-18.8,0-34.1,15.3-34.1,34.1 C71.9,102.1,87.2,117.4,106,117.4z M106,134.5c-22.7,0-68.2,11.4-68.2,34.1v17.1h136.3v-17.1C174.2,145.9,128.7,134.5,106,134.5z"
      />
    </svg>
  );
}

/**
 * Avatar default grup WhatsApp (siluet grup di atas lingkaran abu-abu slate #6B7780)
 */
export function WhatsAppDefaultGroupAvatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 212 212"
      className={cn('w-full h-full select-none shrink-0', className)}
      aria-hidden="true"
    >
      <circle fill="#6B7780" cx="106" cy="106" r="106" />
      <path
        fill="#FFFFFF"
        d="M78.6,112.5c14.4,0,26-11.6,26-26s-11.6-26-26-26s-26,11.6-26,26S64.2,112.5,78.6,112.5z M78.6,125.5 c-17.3,0-52,8.7-52,26v13h104v-13C130.6,134.2,95.9,125.5,78.6,125.5z M134.6,112.5c14.4,0,26-11.6,26-26s-11.6-26-26-26 c-3.1,0-6,0.6-8.8,1.6c5.5,6.6,8.8,15,8.8,24.4c0,9.5-3.3,17.9-8.8,24.4C128.6,111.9,131.5,112.5,134.6,112.5z M134.6,125.5 c-3.8,0-8.2,0.4-12.8,1.2c8,6.7,12.8,15.6,12.8,24.8v13h52v-13C186.6,134.2,151.9,125.5,134.6,125.5z"
      />
    </svg>
  );
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

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const hasValidImage = Boolean(src) && !isPlaceholderAvatar(src) && !imageError;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-visible select-none shrink-0 transition-transform hover:scale-105',
        sizeClasses[size],
        className
      )}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#6B7780] shadow-sm">
        {hasValidImage ? (
          <img
            src={src!}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : isGroup ? (
          <WhatsAppDefaultGroupAvatar />
        ) : (
          <WhatsAppDefaultUserAvatar />
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
