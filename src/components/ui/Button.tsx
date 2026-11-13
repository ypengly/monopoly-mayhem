import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { sound } from '../../utils/sound';

type Variant = 'primary' | 'success' | 'danger' | 'warn' | 'info' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-candy-pink to-[#e63b8a] text-white',
  success: 'bg-gradient-to-b from-[#4ee88f] to-[#1fbf63] text-white',
  danger: 'bg-gradient-to-b from-[#ff7a6b] to-[#e8402f] text-white',
  warn: 'bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink',
  info: 'bg-gradient-to-b from-[#6cc0ff] to-[#2f8cf0] text-white',
  ghost: 'bg-white text-ink',
  dark: 'bg-gradient-to-b from-[#5b45a8] to-[#3a2a7a] text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3 text-lg',
  xl: 'px-10 py-4 text-2xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  silent?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  silent,
  className = '',
  children,
  onClick,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`toy-btn inline-flex items-center justify-center gap-2 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      onClick={(e) => {
        if (!silent) sound.play('click');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
