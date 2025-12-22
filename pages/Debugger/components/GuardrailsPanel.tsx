import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, cn } from '../../../components/UI';
import { GuardrailCheck } from '../../../services/api';

interface GuardrailsPanelProps {
  guardrails: GuardrailCheck[];
  guardrailReason: string;
  guardrailScore: number;
}

export const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ 
  guardrails, 
  guardrailReason, 
  guardrailScore 
}) => {
  const [reasonExpanded, setReasonExpanded] = useState(false);
  
  const overallScore = guardrailScore.toFixed(2);
  const isHighScore = guardrailScore > 0.85;

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
          {guardrails.map((guard, idx) => (
            <div key={guard.id || idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1 pr-4">
                <p className="text-sm font-semibold text-slate-900">{guard.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{guard.description}</p>
              </div>
              <div className="flex items-center flex-shrink-0">
                <Badge 
                  className={cn(
                    "uppercase text-[10px] w-16 justify-center", 
                    guard.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {guard.status ? 'true' : 'false'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
