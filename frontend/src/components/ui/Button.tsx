'use client';

import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  icon,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        'flex items-center gap-2 text-sm',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
