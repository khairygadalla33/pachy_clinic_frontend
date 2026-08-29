import React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-6 ${className}`} {...props}>
      {title && (
        <div className="mb-4 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
