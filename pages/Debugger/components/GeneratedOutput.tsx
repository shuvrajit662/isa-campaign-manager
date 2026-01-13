import React from 'react';
import { Beaker } from 'lucide-react';
import { Badge, cn } from '../../../components/UI';
import { ConversationStatus } from '../../../services/api';

interface GeneratedOutputProps {
  content: string;
  isTestExecution: boolean;
  status?: ConversationStatus | null;
}

// Status display configuration
const STATUS_CONFIG: Record<ConversationStatus, { label: string; className: string }> = {
  RESPOND: { label: 'RESPOND', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  FOLLOW_UP: { label: 'FOLLOW UP', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ESCALATE: { label: 'ESCALATE', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  ESCALATED: { label: 'ESCALATED', className: 'bg-red-50 text-red-700 border-red-200' },
  COMPLETE: { label: 'COMPLETE', className: 'bg-green-50 text-green-700 border-green-200' },
};

export const GeneratedOutput: React.FC<GeneratedOutputProps> = ({ content, isTestExecution, status }) => {
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-900">Generated Output</h2>
          {isTestExecution && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
              <Beaker size={12} className="mr-1" /> Test
            </Badge>
          )}
        </div>
        {statusConfig && (
          <Badge variant="outline" className={cn("border", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        )}
      </div>
      <div className="p-6 overflow-y-auto flex-1 bg-white">
        <div 
          className="prose prose-slate prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
    </div>
  );
};
