import React from 'react';
import { OFFICIAL_ICON_BASE64 } from '../utils/officialIconBase64';

interface MyFinanceIconProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
  alt?: string;
  shape?: 'square' | 'rounded';
}

export const MyFinanceIcon: React.FC<MyFinanceIconProps> = ({
  size = 32,
  className = '',
  withGlow = false,
  alt = 'MyFinance Icon',
  shape = 'rounded',
}) => {
  // Corner radius: 'rounded-none' for square, or adaptive squircle
  const cornerRadiusClass =
    shape === 'square'
      ? 'rounded-none'
      : size <= 20
      ? 'rounded-md'
      : size <= 32
      ? 'rounded-xl'
      : size <= 60
      ? 'rounded-2xl'
      : 'rounded-3xl';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none aspect-square ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className={`absolute inset-0 ${cornerRadiusClass} bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 blur-md opacity-45 -z-10`}
          style={{ width: size, height: size }}
        />
      )}
      <img
        src={OFFICIAL_ICON_BASE64}
        alt={alt}
        className={`w-full h-full object-cover ${cornerRadiusClass} shadow-md border border-white/20 ring-1 ring-cyan-500/20 transition-transform active:scale-95`}
        draggable={false}
        loading="eager"
      />
    </div>
  );
};
