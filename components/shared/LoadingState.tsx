import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { icon: 24, text: 'text-sm' },
    md: { icon: 48, text: 'text-base' },
    lg: { icon: 64, text: 'text-lg' },
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 size={sizes[size].icon} className="animate-spin text-indigo-600 mb-4" />
      <p className={`text-slate-600 ${sizes[size].text}`}>{message}</p>
    </div>
  );
};

export const FullPageLoading: React.FC<LoadingStateProps> = (props) => (
  <div className="flex-1 h-screen flex items-center justify-center bg-slate-50">
    <LoadingState {...props} />
  </div>
);
