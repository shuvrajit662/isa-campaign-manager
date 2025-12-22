import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/UI';
import { FullPageLoading } from '../../components/shared/LoadingState';
import { FullPageError } from '../../components/shared/ErrorState';
import { MOCK_TEST_EXECUTIONS } from '../../services/mockData';
import { 
  fetchConversation, 
  fetchConversationEvents, 
  transformMessagesToDebuggerData, 
  getRelevantMessagesForDebug, 
  extractToolUsages, 
  enrichAssistantsWithConfig, 
  DebuggerAssistant, 
  GuardrailCheck, 
  KnowledgeGroup, 
  ToolUsage 
} from '../../services/api';

import { MOCK_GUARDRAILS, MOCK_KNOWLEDGE_GROUPS, SAMPLE_EMAIL_BODY } from './constants';
import { MOCK_ASSISTANTS } from './mockAssistants';
import {
  DebuggerHeader,
  GeneratedOutput,
  GuardrailsPanel,
  ToolsPanel,
  KnowledgePanel,
  AssistantsTrace,
} from './components';

// Helper function to update output with timestamp
const getUpdatedOutput = (currentOutput: string, statusLabel: string) => {
  const time = new Date().toLocaleTimeString();
  let newOutput = currentOutput;
  try {
    if (currentOutput.trim().startsWith('{')) {
      const json = JSON.parse(currentOutput);
      if (json._debug_metadata) {
        json._debug_metadata.last_run = time;
        json._debug_metadata.status = statusLabel;
      } else {
        json._debug_metadata = { last_run: time, status: statusLabel };
      }
      newOutput = JSON.stringify(json, null, 2);
    } else {
      if (newOutput.includes('<!-- Last run:')) {
        newOutput = newOutput.replace(/<!-- Last run: .* -->/, `<!-- Last run: ${time} -->`);
      } else {
        newOutput += `\n\n<!-- Last run: ${time} -->`;
      }
    }
  } catch (e) {
    newOutput = currentOutput + `\n\n[System] Result refreshed at ${time}`;
  }
  return newOutput;
};

export const Debugger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse the ID: format is conversationId_messageId
  const [conversationId, messageId] = useMemo(() => {
    if (!id) return ['', ''];
    const parts = id.split('_');
    if (parts.length >= 2) {
      const msgId = parts[parts.length - 1];
      const convId = parts.slice(0, -1).join('_');
      return [convId, msgId];
    }
    return [id, ''];
  }, [id]);
  
  const [emailSearch, setEmailSearch] = useState('');
  const [openAssistants, setOpenAssistants] = useState<Record<string, boolean>>(location.state?.openAssistants || {});
  const [assistants, setAssistants] = useState<DebuggerAssistant[]>(location.state?.assistants || MOCK_ASSISTANTS);
  const [guardrails, setGuardrails] = useState<GuardrailCheck[]>(MOCK_GUARDRAILS);
  const [guardrailReason, setGuardrailReason] = useState<string>('');
  const [guardrailScore, setGuardrailScore] = useState<number>(0.9);
  const [generatedOutput, setGeneratedOutput] = useState<string>(SAMPLE_EMAIL_BODY);
  const [knowledgeGroups, setKnowledgeGroups] = useState<KnowledgeGroup[]>(MOCK_KNOWLEDGE_GROUPS);
  const [toolUsages, setToolUsages] = useState<ToolUsage[]>([]);
  const [runningTests, setRunningTests] = useState<Set<number>>(new Set());
  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation data on mount
  useEffect(() => {
    if (!conversationId || !messageId) return;
    if (location.state?.assistants) return; // Skip if we have state from navigation
    
    const loadDebugData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const conversation = await fetchConversation(conversationId);
        const debugData = transformMessagesToDebuggerData(conversation, messageId);
        
        // Fetch events and extract tool usages
        const events = await fetchConversationEvents(conversationId);
        const relevantMessages = getRelevantMessagesForDebug(conversation.messages, messageId);
        const tools = extractToolUsages(relevantMessages, events);
        setToolUsages(tools);
        
        // Enrich assistants with config data
        const enrichedAssistants = await enrichAssistantsWithConfig(debugData.assistants, events);
        
        setAssistants(enrichedAssistants.length > 0 ? enrichedAssistants : MOCK_ASSISTANTS);
        setEmailSearch(debugData.userEmail);
        setGuardrails(debugData.guardrails.length > 0 ? debugData.guardrails : MOCK_GUARDRAILS);
        setGuardrailReason(debugData.guardrailReason || '');
        setGuardrailScore(debugData.guardrailScore || 0);
        setGeneratedOutput(debugData.generatedOutput || SAMPLE_EMAIL_BODY);
        if (debugData.knowledgeGroups.length > 0) {
          setKnowledgeGroups(debugData.knowledgeGroups);
        }
      } catch (err) {
        console.error('Failed to load debug data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load debug data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDebugData();
  }, [conversationId, messageId, location.state?.assistants]);

  // Determine if this is a test execution
  const isTestExecution = useMemo(() => {
    if (location.state?.isTest) return true;
    return MOCK_TEST_EXECUTIONS.some(te => te.conversationId === conversationId && te.isTest);
  }, [conversationId, location.state]);

  const toggleAssistant = (name: string) => {
    setOpenAssistants(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleInputChange = (index: number, value: string) => {
    setAssistants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], input: value };
      return next;
    });
  };

  const handleOutputFormatChange = (index: number, value: string) => {
    setAssistants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], outputFormat: value };
      return next;
    });
  };

  const handleRunTest = (index: number) => {
    setRunningTests(prev => new Set(prev).add(index));
    
    setTimeout(() => {
      const nextAssistants = assistants.map(a => ({ ...a }));
      const currentOutput = nextAssistants[index].output;
      nextAssistants[index].output = getUpdatedOutput(currentOutput, 're-run');
      
      const newId = 'AC' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      navigate(`/debugger/${newId}`, { 
        state: { 
          assistants: nextAssistants,
          openAssistants: openAssistants,
          isTest: true
        } 
      });
    }, 2000);
  };

  const handleRunFullSystem = () => {
    setIsSystemRunning(true);

    setTimeout(() => {
      const nextAssistants = assistants.map(a => ({ 
        ...a,
        output: getUpdatedOutput(a.output, 'full-system-run')
      }));

      const newId = 'AC' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');

      navigate(`/debugger/${newId}`, { 
        state: { 
          assistants: nextAssistants,
          openAssistants: openAssistants,
          isTest: true
        } 
      });
      
      setIsSystemRunning(false);
    }, 3500);
  };

  // Loading state
  if (isLoading) {
    return <FullPageLoading message="Loading debug data..." />;
  }

  // Error state
  if (error) {
    return (
      <FullPageError 
        title="Failed to Load"
        message={error}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <DebuggerHeader
          emailSearch={emailSearch}
          setEmailSearch={setEmailSearch}
          conversationId={conversationId}
          messageId={messageId}
          isSystemRunning={isSystemRunning}
          isTestRunning={runningTests.size > 0}
          onRunFullSystem={handleRunFullSystem}
        />

        {/* Output & Guardrails Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GeneratedOutput 
            content={generatedOutput} 
            isTestExecution={isTestExecution} 
          />
          <GuardrailsPanel 
            guardrails={guardrails} 
            guardrailReason={guardrailReason} 
            guardrailScore={guardrailScore} 
          />
        </div>

        {/* Tools & Knowledge Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ToolsPanel toolUsages={toolUsages} />
          <KnowledgePanel knowledgeGroups={knowledgeGroups} assistants={assistants} />
        </div>

        {/* Assistants Trace */}
        <AssistantsTrace
          assistants={assistants}
          openAssistants={openAssistants}
          runningTests={runningTests}
          isSystemRunning={isSystemRunning}
          onToggleAssistant={toggleAssistant}
          onInputChange={handleInputChange}
          onOutputFormatChange={handleOutputFormatChange}
          onRunTest={handleRunTest}
        />
      </div>
    </div>
  );
};
