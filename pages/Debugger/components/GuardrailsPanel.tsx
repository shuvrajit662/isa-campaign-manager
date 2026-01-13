import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, cn } from '../../../components/UI';
import { GuardrailCheck, GuardrailStatus } from '../../../services/api';

interface GuardrailsPanelProps {
  guardrails: GuardrailCheck[];
  guardrailReason: string;
  guardrailScore: number;
}

// Get display text and styling for guardrail status
const getStatusDisplay = (status: GuardrailStatus): { label: string; className: string } => {
  if (status === 'pass' || status === true) {
    return { label: 'PASS', className: 'bg-green-100 text-green-700' };
  }
  if (status === 'fail' || status === false) {
    return { label: 'FAIL', className: 'bg-red-100 text-red-700' };
  }
  if (status === 'not_applicable') {
    return { label: 'N/A', className: 'bg-slate-100 text-slate-500' };
  }
  // Default fallback for any other value
  return { label: String(status).toUpperCase(), className: 'bg-slate-100 text-slate-500' };
};

export const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ 
  guardrails, 
  guardrailReason, 
  guardrailScore 
}) => {
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const [expandedGuardrails, setExpandedGuardrails] = useState<Set<string>>(new Set());
  
  const overallScore = guardrailScore.toFixed(2);
  const isHighScore = guardrailScore > 0.85;

  const toggleGuardrailExpanded = (id: string) => {
    setExpandedGuardrails(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
        <h2 className="font-semibold text-slate-900">Guardrails</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Overall Score:</span>
          <span className={cn("text-sm font-bold", isHighScore ? "text-green-600" : "text-orange-600")}>{overallScore}</span>
        </div>
      </div>
      
      {guardrailReason && (
        <div className="border-b border-slate-100 bg-amber-50">
          <button
            onClick={() => setReasonExpanded(!reasonExpanded)}
            className="w-full px-6 py-3 flex items-center gap-2 text-left hover:bg-amber-100/50 transition-colors"
          >
            {reasonExpanded ? <ChevronDown size={16} className="text-amber-600" /> : <ChevronRight size={16} className="text-amber-600" />}
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Feedback</span>
          </button>
          {reasonExpanded && (
            <div className="px-6 pb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{guardrailReason}</p>
            </div>
          )}
          {!reasonExpanded && (
            <div className="px-6 pb-3">
              <p className="text-sm text-slate-600 line-clamp-3">{guardrailReason}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="p-0 overflow-y-auto flex-1">
        <div className="divide-y divide-slate-100">
          {guardrails.map((guard, idx) => {
            const statusDisplay = getStatusDisplay(guard.status);
            const hasReasoning = guard.reasoning && guard.reasoning.length > 0;
            const isExpanded = expandedGuardrails.has(guard.id);
            
            return (
              <div key={guard.id || idx} className="hover:bg-slate-50 transition-colors">
                <div 
                  className={cn(
                    "flex items-center justify-between p-4",
                    hasReasoning && "cursor-pointer"
                  )}
                  onClick={() => hasReasoning && toggleGuardrailExpanded(guard.id)}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      {hasReasoning && (
                        isExpanded 
                          ? <ChevronDown size={14} className="text-slate-400" />
                          : <ChevronRight size={14} className="text-slate-400" />
                      )}
                      <p className="text-sm font-semibold text-slate-900">{guard.name}</p>
                    </div>
                    <p className={cn("text-xs text-slate-500 mt-0.5 line-clamp-2", hasReasoning && "ml-5")}>{guard.description}</p>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <Badge 
                      className={cn(
                        "uppercase text-[10px] w-16 justify-center", 
                        statusDisplay.className
                      )}
                    >
                      {statusDisplay.label}
                    </Badge>
                  </div>
                </div>
                {hasReasoning && isExpanded && (
                  <div className="px-4 pb-4 ml-5">
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap">
                      {guard.reasoning}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
