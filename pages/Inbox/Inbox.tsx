import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Inbox as InboxIcon } from 'lucide-react';
import { CAMPAIGN_IDS } from '../../services/mockData';
import { fetchConversations, transformConversationsToEmails } from '../../services/api';
import { Email, FolderType } from '../../types';
import { cn } from '../../components/UI';

import { InboxHeader } from './components/InboxHeader';
import { EmailList } from './components/EmailList';
import { ShortcutsModal } from './components/ShortcutsModal';
import { EmailDetail, ComposeModal } from './InboxComponents';

export const Inbox = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'draft'>('all');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Campaign Filter State - default to ISA Primary Campaign
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(CAMPAIGN_IDS.ISA_PRIMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API pagination state
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch conversations from API
  const loadConversations = useCallback(async (campaignId: string) => {
    if (campaignId === 'all') {
      campaignId = CAMPAIGN_IDS.ISA_PRIMARY;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchConversations({
        campaignId,
        pageSize: 50,
      });
      
      const transformedEmails = transformConversationsToEmails(
        response.conversations,
        campaignId
      );
      
      setEmails(transformedEmails);
      setHasNextPage(response.pagination.hasNextPage);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations on mount and when campaign changes
  useEffect(() => {
    loadConversations(selectedCampaignId);
  }, [selectedCampaignId, loadConversations]);

  // Computed filtered emails - sorted by timestamp descending (latest first)
  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => {
        if (selectedTab === 'draft') {
          return e.folder === FolderType.DRAFTS;
        }
        return true; // 'all' shows everything
      })
      .filter(e => {
        if (selectedCampaignId === 'all') return true;
        return e.campaignId === selectedCampaignId;
      })
      .filter(e => 
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, selectedTab, searchQuery, selectedCampaignId]);

  // Pagination Logic
  const totalItems = filteredEmails.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  
  const paginatedEmails = useMemo(() => {
    return filteredEmails.slice(startIdx, endIdx);
  }, [filteredEmails, startIdx, endIdx]);

  const selectedEmail = useMemo(() => 
    emails.find(e => e.id === selectedEmailId), 
  [emails, selectedEmailId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery, selectedCampaignId, pageSize]);

  // Default Selection Effect
  useEffect(() => {
    if (window.innerWidth > 1024 && paginatedEmails.length > 0) {
      const isSelectedVisible = selectedEmailId && paginatedEmails.some(e => e.id === selectedEmailId);
      if (!selectedEmailId || !isSelectedVisible) {
        setSelectedEmailId(paginatedEmails[0].id);
      }
    } else if (paginatedEmails.length === 0) {
      setSelectedEmailId(null);
    }
  }, [paginatedEmails, selectedEmailId]);

  // Keyboard Navigation Effect (List)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (isComposeOpen || isShortcutsOpen) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = paginatedEmails.findIndex(e => e.id === selectedEmailId);
        
        if (currentIndex === -1 && paginatedEmails.length > 0) {
          setSelectedEmailId(paginatedEmails[0].id);
          return;
        }

        let newIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(paginatedEmails.length - 1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }

        if (newIndex !== currentIndex) {
          const nextEmail = paginatedEmails[newIndex];
          setSelectedEmailId(nextEmail.id);
          document.getElementById(`email-item-${nextEmail.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentPage > 1) setCurrentPage(p => p - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedEmails, selectedEmailId, isComposeOpen, isShortcutsOpen, currentPage, totalPages]);

  const handleCampaignChange = (newId: string) => {
    setSelectedCampaignId(newId);
  };

  const handleRefresh = () => {
    loadConversations(selectedCampaignId);
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmailId(email.id);
  };

  const handleDelete = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: FolderType.TRASH } : e));
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleEscalate = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isEscalated: true } : e));
  };
  
  const handleComplete = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isCompleted: !e.isCompleted } : e));
  };

  const handleSendEmail = (newEmail: Partial<Email>) => {
    const email: Email = {
      id: `new-${Date.now()}`,
      sender: 'Isa',
      senderEmail: 'isa@twilio.com',
      recipient: newEmail.recipient || '',
      subject: newEmail.subject || 'No Subject',
      snippet: newEmail.body?.substring(0, 50) || '',
      body: newEmail.body || '',
      timestamp: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      folder: FolderType.SENT,
      labels: [],
      avatarColor: 'bg-indigo-500'
    };
    setEmails(prev => [email, ...prev]);
    setIsComposeOpen(false);
  };

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Filter Bar */}
        <InboxHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFolder={FolderType.INBOX}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIdx={startIdx}
          endIdx={endIdx}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          selectedCampaignId={selectedCampaignId}
          onCampaignChange={handleCampaignChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onShortcutsClick={() => setIsShortcutsOpen(true)}
        />

        {/* View Splitter */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Email List */}
          {(!selectedEmailId || window.innerWidth > 1024) && (
            <div className={cn(
              "flex flex-col bg-white relative",
              selectedEmailId ? "hidden lg:flex lg:w-2/5 lg:flex-none border-r border-slate-200" : "w-full"
            )}>
              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 py-4 border-b border-slate-100 flex-shrink-0">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedTab === 'all'
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedTab('draft')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedTab === 'draft'
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Draft
                </button>
              </div>
              
              {/* Email List Content */}
              <div className="flex-1 overflow-y-auto">
                <EmailList
                  emails={paginatedEmails}
                  selectedEmailId={selectedEmailId}
                  onSelectEmail={handleSelectEmail}
                  isLoading={isLoading}
                  error={error}
                  onRetry={handleRefresh}
                />
              </div>
            </div>
          )}

          {/* Detailed View */}
          {selectedEmail ? (
            <div className={cn(
              "flex-1 bg-white h-full overflow-hidden",
              selectedEmailId ? "block" : "hidden lg:block"
            )}>
              <EmailDetail 
                email={selectedEmail} 
                onBack={() => setSelectedEmailId(null)} 
                onDelete={handleDelete}
                onEscalate={handleEscalate}
                onComplete={handleComplete}
              />
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50 text-slate-400">
              <div className="text-center">
                <InboxIcon size={64} className="mx-auto mb-4 opacity-10" />
                <p>Select an email to view</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSend={handleSendEmail} 
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
