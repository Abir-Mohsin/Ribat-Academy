import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  [key: string]: any;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[var(--color-button-bg)] text-white hover:bg-[var(--color-button-hover)]',
    outline: 'border-2 border-[var(--color-button-bg)] text-[var(--color-button-bg)] hover:bg-[var(--color-button-bg)] hover:text-white',
    ghost: 'text-[var(--color-button-bg)] hover:bg-[var(--color-button-bg)] hover:bg-opacity-10',
    success: 'bg-[#22C55E] text-white hover:bg-[#16A34A]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
}
