import React from 'react';
import { Inbox as InboxIcon, AlertCircle } from 'lucide-react';
import { cn, Button } from '../../../components/UI';
import { Email } from '../../../types';
import { MOCK_CAMPAIGNS } from '../../../services/mockData';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  showListOnly?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  isLoading,
  error,
  onRetry,
  showListOnly = false,
}) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500 p-4">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load conversations</p>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <InboxIcon size={48} className="mb-4 opacity-20" />
        <p>Folder is empty</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {emails.map(email => (
        <div 
          key={email.id}
          id={`email-item-${email.id}`}
          onClick={() => onSelectEmail(email)}
          className={cn(
            "group flex items-start p-4 cursor-pointer transition-colors hover:shadow-md",
            selectedEmailId === email.id ? "bg-indigo-50/60 border-l-4 border-indigo-500 pl-[13px]" : "hover:bg-slate-50 border-l-4 border-transparent",
            !email.isRead && "bg-slate-50"
          )}
        >
          <div className="flex-shrink-0 pt-1 mr-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium", email.avatarColor || 'bg-slate-400')}>
              {email.sender[0]}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className={cn("text-sm truncate mr-2 flex items-center", !email.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
                {email.sender}
                {email.thread && email.thread.length > 1 && (
                  <span className="text-xs text-slate-500 ml-1 font-normal">({email.thread.length})</span>
                )}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <h4 className={cn("text-sm truncate", !email.isRead ? "font-semibold text-slate-900" : "text-slate-600")}>
              {email.subject}
            </h4>

            {/* Labels between Subject and Snippet */}
            {(email.campaignId || email.labels.length > 0) && (
              <div className="flex flex-wrap gap-1 my-1 items-center">
                {email.campaignId && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-medium truncate max-w-[100px]">
                    {MOCK_CAMPAIGNS.find(c => c.id === email.campaignId)?.name || 'Campaign'}
                  </span>
                )}
                {email.labels.map(label => (
                  <span key={label} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[80px]">
                    {label}
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
              {email.snippet}
            </p>

            {/* Status Badges Below Snippet */}
            <div className="mt-2 flex flex-wrap gap-2">
              {email.isEscalated && (
                <span className="inline-flex items-center text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-bold uppercase tracking-wider">
                  Escalated
                </span>
              )}
              {email.isCompleted && (
                <span className="inline-flex items-center text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase tracking-wider">
                  Completed
                </span>
              )}
              {email.csat && (
                <span 
                  className={cn(
                    "inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider cursor-help",
                    email.csat.score >= 4 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                  )}
                  title={email.csat.comment}
                >
                  CSAT {email.csat.score}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
