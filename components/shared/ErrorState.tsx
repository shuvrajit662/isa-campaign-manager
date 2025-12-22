import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../UI';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Something went wrong',
  message, 
  onRetry,
  onBack,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 ${className}`}>
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-600 mb-4 max-w-md">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};

export const FullPageError: React.FC<ErrorStateProps> = (props) => (
  <div className="flex-1 h-screen flex items-center justify-center bg-slate-50 p-6 md:p-8">
    <ErrorState {...props} />
  </div>
);
