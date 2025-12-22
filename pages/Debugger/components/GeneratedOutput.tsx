import React from 'react';
import { Beaker } from 'lucide-react';
import { Badge } from '../../../components/UI';

interface GeneratedOutputProps {
  content: string;
  isTestExecution: boolean;
}

export const GeneratedOutput: React.FC<GeneratedOutputProps> = ({ content, isTestExecution }) => {
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
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          ESCALATED
        </Badge>
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
