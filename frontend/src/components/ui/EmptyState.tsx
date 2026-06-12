interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 text-center py-12 hover:shadow-sm transition-shadow duration-200">
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
