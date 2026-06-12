import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  overflow?: boolean;
}

export function Card({ children, className, padding = true, overflow = false }: CardProps) {
  return (
    <div
      className={clsx(
        'card',
        !padding && 'p-0',
        overflow && 'overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}
