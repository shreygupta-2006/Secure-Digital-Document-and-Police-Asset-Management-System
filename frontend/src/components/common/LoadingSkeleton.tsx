import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => {
  return (
    <div className="w-full border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
      <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3.5 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 25}px` }} />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-14 flex items-center px-4 gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-slate-100 rounded animate-pulse"
                style={{ width: `${80 + ((r + c) % 4) * 35}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs flex flex-col gap-3 animate-pulse"
        >
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-24 bg-slate-200 rounded" />
            <div className="h-5 w-5 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
