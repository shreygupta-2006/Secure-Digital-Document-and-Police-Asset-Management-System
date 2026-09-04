import React from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  statusCode?: number | string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Retrieval Failed',
  message,
  statusCode,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center border border-rose-200 rounded-md bg-rose-50/50 max-w-2xl mx-auto my-6 shadow-2xs ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3 border border-rose-200">
        {statusCode === 403 ? <ShieldAlert className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6" />}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-semibold text-rose-900">{title}</h3>
        {statusCode && (
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-mono font-medium border border-rose-200">
            HTTP {statusCode}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-slate-600 max-w-lg leading-relaxed">
        {message || 'An unexpected error occurred while communicating with the department servers. Please retry or contact technical support.'}
      </p>

      {onRetry && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium tracking-wide transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Request
          </button>
        </div>
      )}
    </div>
  );
};

