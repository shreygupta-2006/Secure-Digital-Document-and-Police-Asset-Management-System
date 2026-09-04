import React from 'react';
import { AssetStatus, UserRole, MaintenancePriority, DocumentType } from '../../types';

interface StatusBadgeProps {
  status?: AssetStatus | string;
  role?: UserRole;
  priority?: MaintenancePriority;
  docType?: DocumentType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  role,
  priority,
  docType,
  className = '',
}) => {
  if (role) {
    const roleStyles: Record<UserRole, { bg: string; text: string; border: string; label: string }> = {
      ADMIN: {
        bg: 'bg-slate-100',
        text: 'text-slate-800 font-semibold',
        border: 'border-slate-300',
        label: 'Administrator',
      },
      STORE_KEEPER: {
        bg: 'bg-amber-50',
        text: 'text-amber-800 font-medium',
        border: 'border-amber-200',
        label: 'Store Keeper',
      },
      OFFICER: {
        bg: 'bg-blue-50',
        text: 'text-blue-800 font-medium',
        border: 'border-blue-200',
        label: 'Officer',
      },
      AUDITOR: {
        bg: 'bg-purple-50',
        text: 'text-purple-800 font-medium',
        border: 'border-purple-200',
        label: 'Auditor',
      },
      VIEWER: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: 'Viewer',
      },
    };

    const config = roleStyles[role] || roleStyles.VIEWER;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${config.bg} ${config.text} ${config.border} ${className}`}
      >
        {config.label}
      </span>
    );
  }

  if (status) {
    const upper = status.toUpperCase();
    let style = 'bg-slate-100 text-slate-700 border-slate-200';

    if (upper === 'AVAILABLE' || upper === 'READY') {
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (upper === 'ASSIGNED' || upper === 'FIELD_ACTIVE' || upper === 'ACTIVE') {
      style = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (upper === 'MAINTENANCE' || upper === 'IN_MAINTENANCE' || upper === 'IN_PROGRESS' || upper === 'PENDING' || upper === 'OVERDUE_MAINT') {
      style = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (upper === 'RETIRED' || upper === 'OVERDUE' || upper === 'FAILURE' || upper === 'CRITICAL' || upper === 'LOST' || upper === 'DAMAGED') {
      style = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (upper === 'COMPLETED' || upper === 'SUCCESS' || upper === 'RETURNED' || upper === 'SYNCHED') {
      style = 'bg-slate-100 text-slate-700 border-slate-200';
    }

    // Human readable status label
    const formatStatus = (s: string) => {
      switch (s.toUpperCase()) {
        case 'AVAILABLE': return 'Available';
        case 'ASSIGNED': return 'Assigned';
        case 'MAINTENANCE':
        case 'IN_MAINTENANCE': return 'Under Maintenance';
        case 'RETIRED': return 'Retired';
        case 'LOST': return 'Lost';
        case 'DAMAGED': return 'Damaged';
        case 'REGISTERED': return 'Registered';
        case 'PENDING': return 'Pending';
        case 'SUCCESS': return 'Success';
        case 'COMPLETED': return 'Completed';
        default: return s.replace(/_/g, ' ');
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style} ${className}`}
      >
        {formatStatus(status)}
      </span>
    );
  }

  if (priority) {
    const priorityMap: Record<MaintenancePriority, string> = {
      LOW: 'bg-slate-100 text-slate-600 border-slate-200',
      MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
      HIGH: 'bg-amber-50 text-amber-800 border-amber-200',
      CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${priorityMap[priority] || priorityMap.LOW} ${className}`}
      >
        {priority.charAt(0) + priority.slice(1).toLowerCase()}
      </span>
    );
  }

  if (docType) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-100 text-slate-700 border-slate-200 ${className}`}
      >
        {docType.replace(/_/g, ' ')}
      </span>
    );
  }

  return null;
};

