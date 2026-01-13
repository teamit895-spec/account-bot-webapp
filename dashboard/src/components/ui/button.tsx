'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-card border border-border text-gray-300 hover:bg-hover hover:border-purple-500/50':
              variant === 'default',
            'border border-border text-gray-400 hover:text-white hover:border-purple-500/50':
              variant === 'outline',
            'text-gray-400 hover:text-white hover:bg-hover':
              variant === 'ghost',
            'bg-purple-600 text-white hover:bg-purple-700':
              variant === 'primary',
            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
