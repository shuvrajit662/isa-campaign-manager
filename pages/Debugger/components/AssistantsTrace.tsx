import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronRight, Play, Loader2, Maximize2, Terminal, BookOpen } from 'lucide-react';
import { Button, Badge, cn, Modal } from '../../../components/UI';
import { DebuggerAssistant } from '../../../services/api';

interface AssistantsTraceProps {
  assistants: DebuggerAssistant[];
  openAssistants: Record<string, boolean>;
  runningTests: Set<number>;
  isSystemRunning: boolean;
  onToggleAssistant: (name: string) => void;
  onInputChange: (index: number, value: string) => void;
  onOutputFormatChange: (index: number, value: string) => void;
  onRunTest: (index: number) => void;
}

export const AssistantsTrace: React.FC<AssistantsTraceProps> = ({
  assistants,
  openAssistants,
  runningTests,
  isSystemRunning,
  onToggleAssistant,
  onInputChange,
  onOutputFormatChange,
  onRunTest,
}) => {
  const [assistantModalData, setAssistantModalData] = useState<{ 
    assistantIdx: number; 
    section: 'input' | 'output' | 'outputFormat' | 'prompt' 
  } | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2">
          <Bot size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Assistants Execution Trace</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {assistants.map((assistant, idx) => {
            const isOpen = openAssistants[assistant.name];
            const isRunning = runningTests.has(idx);
            return (
              <div key={idx} className="group">
                <button 
                  onClick={() => onToggleAssistant(assistant.name)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      isOpen ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                    )}>
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-900">{assistant.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">ID: {assistant.messageId}</span>
                    {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 pl-[3.25rem] animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Main Trace Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      
                      {/* Left Column: Input + Prompt */}
                      <div className="flex flex-col gap-6">
                        {/* Input */}
                        <div className="flex flex-col h-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'input' })}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                title="Expand Input"
                              >
                                <Maximize2 size={12} className="text-slate-400" />
                              </button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className={cn("h-6 px-2", isRunning ? "text-slate-400" : "text-indigo-600 hover:bg-indigo-50")}
                                onClick={(e) => { e.stopPropagation(); onRunTest(idx); }}
                                disabled={isRunning || isSystemRunning}
                                title="Test this prompt"
                              >
                                {isRunning ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} className="mr-1.5 fill-indigo-600" />} 
                                {isRunning ? <span className="ml-1.5">Running...</span> : 'Test'}
                              </Button>
                            </div>
                          </div>
                          <textarea 
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 font-mono w-full flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                            value={assistant.input}
                            onChange={(e) => onInputChange(idx, e.target.value)}
                            spellCheck={false}
                          />
                        </div>
                        
                        {/* System Prompt */}
                        <div className="flex flex-col h-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt</p>
                            <button
                              onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'prompt' })}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Expand Prompt"
                            >
                              <Maximize2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900 font-mono overflow-auto flex-1">
                            <pre className="whitespace-pre-wrap">{assistant.systemPrompt || 'No system prompt configured'}</pre>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Output + Output Format */}
                      <div className="flex flex-col gap-6">
                        {/* Output */}
                        <div className="flex flex-col h-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</p>
                            <button
                              onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'output' })}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Expand Output"
                            >
                              <Maximize2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900 font-mono overflow-auto flex-1 relative">
                            {(isRunning || isSystemRunning) && (
                              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                                  <span className="text-xs font-medium text-indigo-700">Generating response...</span>
                                </div>
                              </div>
                            )}
                            <pre className="whitespace-pre-wrap">{assistant.output}</pre>
                          </div>
                        </div>
                        
                        {/* Output Format */}
                        <div className="flex flex-col h-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Format</p>
                            <button
                              onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'outputFormat' })}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Expand Output Format"
                            >
                              <Maximize2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                          <textarea 
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-mono w-full flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                            value={assistant.outputFormat}
                            onChange={(e) => onOutputFormatChange(idx, e.target.value)}
                            spellCheck={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Secondary Trace Grid: Tools & Knowledge */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Box 3: Tools */}
                      <div className="flex flex-col h-full">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
                          {/* Available Tools */}
                          <div className="p-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available</p>
                            <div className="flex flex-wrap gap-2">
                              {assistant.toolsAvailable.map((t: string) => (
                                <Badge key={t} variant="outline" className="border-slate-200 text-slate-500 bg-white py-0.5 px-2 text-[10px]">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {/* Used Tools */}
                          <div className="p-3 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Used</p>
                            {assistant.toolsUsed && assistant.toolsUsed.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {assistant.toolsUsed.map((t: string) => (
                                  <Badge key={t} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 py-1 px-2">
                                    <Terminal size={12} className="mr-1.5" /> {t}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 italic text-xs">None</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Box 4: Knowledge */}
                      <div className="flex flex-col h-full">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Knowledge Base</p>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
                          {/* Available Knowledge */}
                          <div className="p-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available</p>
                            <div className="flex flex-wrap gap-2">
                              {assistant.knowledgeAvailable.map((k: string) => (
                                <Badge key={k} variant="outline" className="border-slate-200 text-slate-500 bg-white py-0.5 px-2 text-[10px]">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {/* Used Knowledge */}
                          <div className="p-3 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Used</p>
                            {assistant.knowledgeUsed && assistant.knowledgeUsed.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(Array.from(new Set(assistant.knowledgeUsed)) as string[]).map((k) => (
                                  <Badge key={k} variant="secondary" className="bg-slate-100 text-slate-700 py-1 px-2">
                                    <BookOpen size={12} className="mr-1.5" /> {k}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 italic text-xs">None</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assistant Section Modal */}
      <Modal 
        isOpen={assistantModalData !== null} 
        onClose={() => setAssistantModalData(null)}
        title={assistantModalData !== null 
          ? `${assistants[assistantModalData.assistantIdx]?.name} - ${
              assistantModalData.section === 'input' ? 'Input' :
              assistantModalData.section === 'output' ? 'Output' :
              assistantModalData.section === 'outputFormat' ? 'Output Format' :
              'Prompt'
            }`
          : ''}
        className="max-w-4xl"
      >
        {assistantModalData !== null && assistants[assistantModalData.assistantIdx] && (
          <div className="space-y-4">
            {assistantModalData.section === 'input' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].input}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'output' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-indigo-900 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].output}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'outputFormat' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].outputFormat}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'prompt' && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-amber-900 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].systemPrompt || 'No system prompt configured'}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
