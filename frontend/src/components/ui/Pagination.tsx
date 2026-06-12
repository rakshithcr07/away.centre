import clsx from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl?: string;
}

export function Pagination({ page, totalPages, baseUrl = '?' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prefix = baseUrl.includes('?') ? baseUrl : `${baseUrl}?`;

  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        const isActive = page === pageNum;

        return (
          <a
            key={pageNum}
            href={`${prefix}page=${pageNum}`}
            className={clsx(
              'px-3 py-1 rounded text-sm',
              isActive
                ? 'bg-away-600 text-white'
                : 'bg-surface-hover text-gray-400 hover:text-gray-200'
            )}
          >
            {pageNum}
          </a>
        );
      })}
    </div>
  );
}
