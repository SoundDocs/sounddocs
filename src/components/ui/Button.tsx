/**
 * A reusable Button component that provides consistent styling and behavior across the application.
 * Features:
 * - Multiple variants (default, destructive, outline, secondary, ghost)
 * - Different sizes (default, sm, lg, icon)
 * - Supports all standard HTML button attributes
 * - Fully accessible with keyboard navigation and focus states
 * - Type-safe props with TypeScript
 * - Supports custom className overrides
 * - Handles disabled states
 * - Forwards refs for integration with form libraries
 * 
 * Usage:
 * ```tsx
 * <Button variant="destructive" size="lg" onClick={handleClick}>
 *   Delete Item
 * </Button>
 * ```
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const getButtonClasses = (
  variant: ButtonProps['variant'] = 'default',
  size: ButtonProps['size'] = 'default',
  className?: string
) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-700 bg-transparent hover:bg-gray-800 text-white',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700',
    ghost: 'hover:bg-gray-800 text-white hover:text-white',
  }[variant];

  const sizeClasses = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9',
  }[size];

  return [baseClasses, variantClasses, sizeClasses, className]
    .filter(Boolean)
    .join(' ');
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={getButtonClasses(variant, size, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';