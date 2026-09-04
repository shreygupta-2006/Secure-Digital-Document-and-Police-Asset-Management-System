import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const fromItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const toItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-slate-800">{fromItem}</span> to{' '}
          <span className="font-semibold text-slate-800">{toItem}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalElements}</span> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <label htmlFor="per-page-select" className="text-slate-500">Rows per page:</label>
            <select
              id="per-page-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <span className="px-2 font-mono text-slate-700">
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || totalPages === 0}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
