interface SectionTitleProps {
  title: string;
  className?: string;
}

export function SectionTitle({ title, className = 'mb-4' }: SectionTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
      {title}
    </h3>
  );
}
