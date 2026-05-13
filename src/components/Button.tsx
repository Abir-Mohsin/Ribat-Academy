import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-sm border border-transparent',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-black',
    success: 'bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs font-semibold',
    md: 'px-6 py-3 text-sm font-semibold',
    lg: 'px-8 py-4 text-base font-bold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
}
