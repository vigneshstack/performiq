import * as React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const avatarColors = [
  'bg-indigo-100 text-indigo-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-teal-100 text-teal-700',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  default: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function Avatar({ src, name, size = 'default', className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const initials = getInitials(name);
  const colorClass = name ? avatarColors[hashString(name) % avatarColors.length] : avatarColors[0];

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden font-semibold',
        sizeClasses[size],
        !showImage && colorClass,
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'default' | 'lg';
}

function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((a, i) => (
        <Avatar
          key={i}
          src={a.src}
          name={a.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-zinc-200 text-zinc-600 font-semibold ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
