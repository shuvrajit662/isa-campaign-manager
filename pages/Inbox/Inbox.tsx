
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Inbox as InboxIcon, Send as SendIcon, File as DraftIcon, Trash2, Tag, Star, ChevronDown, Filter, Keyboard, Command } from 'lucide-react';
import { MOCK_EMAILS, MOCK_CAMPAIGNS, MOCK_LABELS } from '../../services/mockData';
import { Email, FolderType } from '../../types';
import { cn, Button, Modal } from '../../components/UI';
import { EmailDetail, ComposeModal } from './InboxComponents';

export const Inbox = () => {
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>(FolderType.INBOX);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Campaign Filter State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Computed filtered emails
  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => e.folder === selectedFolder)
      .filter(e => {
        if (selectedCampaignId === 'all') return true;
        return e.campaignId === selectedCampaignId;
      })
      .filter(e => 
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [emails, selectedFolder, searchQuery, selectedCampaignId]);

  const selectedEmail = useMemo(() => 
    emails.find(e => e.id === selectedEmailId), 
  [emails, selectedEmailId]);

  // Default Selection Effect
  useEffect(() => {
    if (!selectedEmailId && filteredEmails.length > 0 && window.innerWidth > 1024) {
      setSelectedEmailId(filteredEmails[0].id);
    }
  }, [filteredEmails, selectedEmailId]);

  // Keyboard Navigation Effect (List)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused or modals open
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (isComposeOpen || isShortcutsOpen) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredEmails.findIndex(e => e.id === selectedEmailId);
        
        // If nothing selected, select first
        if (currentIndex === -1 && filteredEmails.length > 0) {
          setSelectedEmailId(filteredEmails[0].id);
          return;
        }

        let newIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(filteredEmails.length - 1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }

        if (newIndex !== currentIndex) {
          const nextEmail = filteredEmails[newIndex];
          setSelectedEmailId(nextEmail.id);
          // Scroll into view
          document.getElementById(`email-item-${nextEmail.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedEmailId, isComposeOpen, isShortcutsOpen]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setIsLoading(true);
    // Simulate network latency
    setTimeout(() => {
      setSelectedCampaignId(newId);
      setIsLoading(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: FolderType.TRASH } : e));
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleEscalate = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isEscalated: true } : e));
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

  const SidebarItem = ({ icon: Icon, label, type, count }: { icon: any, label: string, type: FolderType, count?: number }) => (
    <button
      onClick={() => {
        setSelectedFolder(type);
        setSelectedEmailId(null);
      }}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-colors mb-1",
        selectedFolder === type 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon size={18} />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-white">
      {/* Inbox Sidebar (Folders) */}
      <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col py-6 px-3 flex-shrink-0 overflow-y-auto">
        <Button 
          className="w-full mb-6 bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-700 justify-start px-4 h-12 rounded-2xl transition-colors flex-shrink-0" 
          onClick={() => setIsComposeOpen(true)}
        >
          <span className="flex items-center text-lg mr-3">+</span> Compose
        </Button>
        
        <div className="space-y-1 flex-shrink-0">
          <SidebarItem 
            icon={InboxIcon} 
            label="Inbox" 
            type={FolderType.INBOX} 
            count={emails.filter(e => e.folder === FolderType.INBOX && !e.isRead).length} 
          />
          <SidebarItem icon={Star} label="Starred" type={FolderType.INBOX} /> {/* Mocked type for now */}
          <SidebarItem icon={SendIcon} label="Sent" type={FolderType.SENT} />
          <SidebarItem icon={DraftIcon} label="Drafts" type={FolderType.DRAFTS} count={emails.filter(e => e.folder === FolderType.DRAFTS).length} />
          <SidebarItem icon={Trash2} label="Trash" type={FolderType.TRASH} />
        </div>

        <div className="mt-8">
          <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Labels</h3>
          <div className="space-y-1">
             {MOCK_LABELS.map(label => (
               <button key={label} className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg group" title={label}>
                 <Tag size={16} className="text-slate-400 flex-shrink-0" />
                 <span className="truncate text-left">{label}</span>
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Filter Bar */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0 gap-4">
          <div className="relative max-w-lg w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={`Search in ${selectedFolder}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-600"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts"
            >
              <Keyboard size={20} />
            </Button>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Filter size={16} />
              </div>
              <select
                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-10 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                value={isLoading ? selectedCampaignId : selectedCampaignId}
                onChange={handleCampaignChange}
              >
                <option value="all">All Campaigns</option>
                {MOCK_CAMPAIGNS.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* View Splitter */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Email List */}
          {(!selectedEmailId || window.innerWidth > 1024) && (
            <div className={cn(
              "flex-1 overflow-y-auto bg-white relative",
              selectedEmailId ? "hidden lg:block lg:w-2/5 lg:flex-none border-r border-slate-200" : "w-full"
            )}>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <InboxIcon size={48} className="mb-4 opacity-20" />
                  <p>Folder is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredEmails.map(email => (
                    <div 
                      key={email.id}
                      id={`email-item-${email.id}`}
                      onClick={() => {
                        setSelectedEmailId(email.id);
                        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
                      }}
                      className={cn(
                        "group flex items-start p-4 cursor-pointer transition-colors hover:shadow-md",
                        selectedEmailId === email.id ? "bg-indigo-50/60 border-l-4 border-indigo-500 pl-[13px]" : "hover:bg-slate-50 border-l-4 border-transparent",
                        !email.isRead && "bg-slate-50"
                      )}
                    >
                      <div className="flex-shrink-0 pt-1 mr-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium", email.avatarColor || 'bg-slate-400')}>
                          {email.sender[0]}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn("text-sm truncate mr-2 flex items-center", !email.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
                            {email.sender}
                            {email.thread && email.thread.length > 1 && (
                              <span className="text-xs text-slate-500 ml-1 font-normal">({email.thread.length})</span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                            {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        <h4 className={cn("text-sm truncate", !email.isRead ? "font-semibold text-slate-900" : "text-slate-600")}>
                          {email.subject}
                        </h4>

                        {/* Labels between Subject and Snippet */}
                        {(email.campaignId || email.labels.length > 0) && (
                          <div className="flex flex-wrap gap-1 my-1 items-center">
                            {email.campaignId && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-medium truncate max-w-[100px]">
                                {MOCK_CAMPAIGNS.find(c => c.id === email.campaignId)?.name || 'Campaign'}
                              </span>
                            )}
                            {email.labels.map(label => (
                              <span key={label} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[80px]">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                          {email.snippet}
                        </p>

                        {/* Escalated Status Below Snippet */}
                        {email.isEscalated && (
                          <div className="mt-2">
                            <span className="inline-flex items-center text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-bold uppercase tracking-wider">
                              Escalated
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Shortcuts Modal */}
      <Modal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        title="Keyboard Shortcuts"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Previous / Next Email</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">↑</kbd>
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">↓</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Reply</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">r</kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Forward</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">f</kbd>
          </div>
           <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Label</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">l</kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Scroll Email</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">Space</kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Focus Items</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">Tab</kbd>
          </div>
        </div>
      </Modal>
    </div>
  );
};
