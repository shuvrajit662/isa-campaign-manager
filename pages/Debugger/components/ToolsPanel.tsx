import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, Maximize2 } from 'lucide-react';
import { Badge, Modal } from '../../../components/UI';
import { ToolUsage } from '../../../services/api';

interface ToolsPanelProps {
  toolUsages: ToolUsage[];
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ toolUsages }) => {
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const [toolModalIndex, setToolModalIndex] = useState<number | null>(null);
  const [toolModalSection, setToolModalSection] = useState<'input' | 'output' | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2 flex-shrink-0">
          <Terminal size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Tools Used</h2>
          {toolUsages.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">{toolUsages.length} tool{toolUsages.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {toolUsages.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">No tools used in this execution</div>
          ) : (
            toolUsages.map((tool, idx) => {
              const isExpanded = expandedTools[idx];
              return (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTools(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-sm font-medium text-slate-900">{tool.toolName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Used By</span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">{tool.usedBy}</Badge>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-3 space-y-3 border-t border-slate-200">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Input</p>
                          <button
                            onClick={() => { setToolModalIndex(idx); setToolModalSection('input'); }}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            title="Expand Input"
                          >
                            <Maximize2 size={12} className="text-slate-400" />
                          </button>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-48 relative">
                          <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                            {JSON.stringify(tool.input, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Output</p>
                          <button
                            onClick={() => { setToolModalIndex(idx); setToolModalSection('output'); }}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            title="Expand Output"
                          >
                            <Maximize2 size={12} className="text-slate-400" />
                          </button>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-48 relative">
                          <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap">
                            {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tool Details Modal */}
      <Modal 
        isOpen={toolModalIndex !== null} 
        onClose={() => { setToolModalIndex(null); setToolModalSection(null); }}
        title={toolModalIndex !== null 
          ? `${toolUsages[toolModalIndex]?.toolName}${toolModalSection ? ` - ${toolModalSection.charAt(0).toUpperCase() + toolModalSection.slice(1)}` : ''}`
          : ''}
        className="max-w-3xl"
      >
        {toolModalIndex !== null && toolUsages[toolModalIndex] && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Used By</span>
              <Badge variant="secondary" className="text-xs">{toolUsages[toolModalIndex].usedBy}</Badge>
            </div>
            {(toolModalSection === null || toolModalSection === 'input') && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Input</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
                  <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(toolUsages[toolModalIndex].input, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {(toolModalSection === null || toolModalSection === 'output') && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Output</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
                  <pre className="text-sm text-indigo-300 font-mono whitespace-pre-wrap">
                    {typeof toolUsages[toolModalIndex].output === 'string' 
                      ? toolUsages[toolModalIndex].output 
                      : JSON.stringify(toolUsages[toolModalIndex].output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
