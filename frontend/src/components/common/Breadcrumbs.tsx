import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-slate-800 transition-colors font-medium hover:underline underline-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-800 font-semibold truncate max-w-xs' : ''}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
