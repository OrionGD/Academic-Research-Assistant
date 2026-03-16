import React from 'react';
import { cn } from '../utils/helpers';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-surface-light/50 rounded-md", className)} />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface-dark p-6 rounded-3xl border border-surface-light shadow-lg space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <Skeleton className="w-10 h-4 rounded-lg" />
    </div>
    <Skeleton className="w-24 h-4" />
    <Skeleton className="w-16 h-8" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-48 h-4" />
      </div>
    </td>
    <td className="px-8 py-5"><Skeleton className="w-32 h-4" /></td>
    <td className="px-8 py-5"><Skeleton className="w-12 h-4" /></td>
    <td className="px-8 py-5"><Skeleton className="w-24 h-4" /></td>
    <td className="px-8 py-5"><Skeleton className="w-20 h-6 rounded-full" /></td>
    <td className="px-8 py-5 text-right"><Skeleton className="w-8 h-8 rounded-lg ml-auto" /></td>
  </tr>
);

export const Loader: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div 
      className="animate-spin rounded-full border-2 border-accent-primary border-t-transparent" 
      style={{ width: size, height: size }}
    />
  </div>
);
