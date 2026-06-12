import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const inputClass =
  'bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-away transition-colors';

export function Input({ className, ...props }: InputProps) {
  return <input className={clsx(inputClass, className)} {...props} />;
}
