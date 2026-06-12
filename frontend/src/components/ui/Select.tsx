import clsx from 'clsx';
import { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  className?: string;
}

const selectClass =
  'bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-away transition-colors';

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <select className={clsx(selectClass, className)} {...props}>
      {children}
    </select>
  );
}
