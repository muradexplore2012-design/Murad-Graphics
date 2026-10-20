import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-2.5 sm:p-3.5 shadow-sm animate-pulse flex flex-col justify-between">
    <div className="w-full aspect-square bg-slate-200 rounded-xl sm:rounded-2xl mb-2 sm:mb-3" />
    <div className="space-y-2 px-1">
      <div className="h-3.5 sm:h-4 bg-slate-200 rounded-md w-3/4 mx-auto" />
      <div className="h-3.5 sm:h-4 bg-slate-200 rounded-md w-1/2 mx-auto" />
      <div className="pt-2 flex items-center gap-1.5 sm:gap-2">
        <div className="h-7 sm:h-9 bg-slate-200 rounded-full flex-1" />
        <div className="h-7 w-7 sm:h-9 sm:w-9 bg-slate-200 rounded-full shrink-0" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200" />
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="h-16 border-b border-slate-100 flex items-center px-6 gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/6 ml-auto" />
        <div className="h-4 bg-slate-200 rounded w-20" />
        <div className="h-8 bg-slate-200 rounded-lg w-16" />
      </div>
    ))}
  </div>
);
