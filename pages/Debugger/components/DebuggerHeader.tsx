import React from 'react';
import { Search, Play, Loader2, Clock, Hash, MessageSquare } from 'lucide-react';
import { Input, Button } from '../../../components/UI';
import { TRACE_METADATA } from '../constants';

interface DebuggerHeaderProps {
  emailSearch: string;
  setEmailSearch: (value: string) => void;
  conversationId: string;
  messageId: string;
  isSystemRunning: boolean;
  isTestRunning: boolean;
  onRunFullSystem: () => void;
}

export const DebuggerHeader: React.FC<DebuggerHeaderProps> = ({
  emailSearch,
  setEmailSearch,
  conversationId,
  messageId,
  isSystemRunning,
  isTestRunning,
  onRunFullSystem,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Debugger</h1>
          <p className="text-slate-500 mt-1">Trace generation, guardrails, and tool usage.</p>
        </div>
        <Button 
            onClick={onRunFullSystem} 
            disabled={isSystemRunning || isTestRunning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all"
            size="lg"
        >
            {isSystemRunning ? (
                <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Running Trace...
                </>
            ) : (
                <>
                    <Play size={20} className="mr-2 fill-white" />
                    Re-run Full Trace
                </>
            )}
        </Button>
      </div>

      {/* Context Bar (Search + Metadata) */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-2">
        
        {/* Search Area */}
        <div className="flex-1 flex gap-2 p-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white h-10" 
              placeholder="Search by email..." 
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => console.log('Searching', emailSearch)} className="px-6">
            Search
          </Button>
        </div>

        {/* Divider (Desktop) */}
        <div className="hidden xl:block w-px bg-slate-100 my-2"></div>
        {/* Divider (Mobile) */}
        <div className="block xl:hidden h-px bg-slate-100 mx-2"></div>

        {/* Metadata Area */}
        <div className="flex flex-wrap items-center gap-3 p-2 xl:px-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            <MessageSquare size={14} className="text-indigo-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Conv</span>
            <span className="font-mono text-xs text-slate-700 select-all font-medium">{conversationId || TRACE_METADATA.conversationId}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            <Hash size={14} className="text-indigo-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Msg</span>
            <span className="font-mono text-xs text-slate-700 select-all font-medium">{messageId || TRACE_METADATA.rootMessageId}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            <Clock size={14} className="text-indigo-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Time</span>
            <span className="text-xs text-slate-700 font-medium">{new Date(TRACE_METADATA.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
