import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../UI';

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon,
  title,
  message, 
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <Icon size={48} className="text-slate-300 mb-4" />
      {title && <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>}
      <p className="text-slate-500 mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
};
