import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
        {icon || <PackageOpen className="w-8 h-8 text-blue-600 stroke-[1.75]" />}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm sm:text-base mb-6 leading-relaxed max-w-md">
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <Link
            to={actionHref}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
};
