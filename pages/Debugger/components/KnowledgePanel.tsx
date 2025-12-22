import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, cn } from '../../../components/UI';
import { KnowledgeGroup, DebuggerAssistant } from '../../../services/api';

interface KnowledgePanelProps {
  knowledgeGroups: KnowledgeGroup[];
  assistants: DebuggerAssistant[];
}

export const KnowledgePanel: React.FC<KnowledgePanelProps> = ({ knowledgeGroups, assistants }) => {
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});

  const getAssistantsForKnowledge = (groupName: string) => {
    return assistants.filter((a: DebuggerAssistant) => a.knowledgeUsed.includes(groupName)).map((a: DebuggerAssistant) => a.name);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2 flex-shrink-0">
        <BookOpen size={18} className="text-slate-500" />
        <h2 className="font-semibold text-slate-900">Knowledge Base</h2>
      </div>
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {knowledgeGroups.map((group, groupIdx) => {
          const usedBy = getAssistantsForKnowledge(group.sourceName);
          return (
            <div key={groupIdx} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{group.sourceName}</Badge>
                {usedBy.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Used By</span>
                    {usedBy.map((u: string) => (
                      <Badge key={u} variant="secondary" className="text-[10px] py-0 px-2 h-5">{u}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {group.chunks.map((chunk, chunkIdx) => {
                  const chunkKey = `${groupIdx}-${chunkIdx}`;
                  const isExpanded = expandedChunks[chunkKey];
                  return (
                    <div key={chunkIdx} className="border border-slate-100 rounded bg-slate-50">
                      <button
                        onClick={() => setExpandedChunks(prev => ({ ...prev, [chunkKey]: !prev[chunkKey] }))}
                        className="w-full flex items-start gap-3 p-2 text-left hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={14} className="text-slate-400 mt-0.5 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          {chunk.title && (
                            <p className="text-xs font-medium text-slate-700 mb-1">{chunk.title}</p>
                          )}
                          <p className={cn("text-sm text-slate-600", !isExpanded && "line-clamp-3")}>
                            {chunk.preview}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
