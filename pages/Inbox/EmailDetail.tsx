import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Trash2, MoreVertical, X, Tag, Search, 
  CornerUpLeft, CornerUpRight, AlertCircle, ShieldAlert, Bug, CheckCircle 
} from 'lucide-react';
import { Email } from '../../types';
import { Button, cn } from '../../components/UI';
import { MOCK_LABELS } from '../../services/mockData';
import { MessageComposer } from './MessageComposer';

// --- Isa Email Signature ---
const ISA_SIGNATURE = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; font-size: 13px; line-height: 1.3; max-width: 400px; margin-top: 12px;">
    <div style="border-top: 1px solid #e0e0e0; padding-top: 12px;">
        <div style="font-weight: 500; color: #1a1a1a; margin-bottom: 2px;">Isa Bell</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 12px;">Digital Sales</div>
        
        <div style="margin-bottom: 10px;">
            <a href="https://www.twilio.com?utm_source=email_signature" style="display: inline-block;">
                <img src="https://www.twilio.com/content/dam/twilio-internal/email-signature/twilio-logo.png" width="110" height="33" alt="Twilio" style="vertical-align: middle;">
            </a>
        </div>
        
        <div style="font-size: 11px; color: #666; margin-bottom: 2px;">EMAIL</div>
        <div style="margin-bottom: 12px;">
            <a href="mailto:isa@twilio.com" style="color: #1a1a1a; text-decoration: none;">isa@twilio.com</a>
        </div>
    </div>
    
    <div style="margin-top: 10px; padding: 8px; background-color: #f5f5f5; border-left: 3px solid #ddd; font-size: 10px; color: #666; line-height: 1.3;">
        Isa Bell is powered by AI and may generate information that is inaccurate or does not meet your needs or expectations. You should independently verify this information before using it. By using Isa Bell, you understand that any information you provide will be processed to generate a response. You are responsible for any information you share. Twilio is not responsible for your use of this generated information, and your use of Isa Bell does not modify your agreement with Twilio. For more information on how Isa Bell processes and protects your personal information, review Twilio's Privacy Notice.
        <br><br>
        <div style="text-align: center; margin-top: 4px;">
            <a href="https://pages.twilio.com/TW_SG_Email-Preference-Center.html?mkt_unsubscribe=1" style="color: #555; text-decoration: none; font-size: 11px; font-weight: 600;">
                📧 Unsubscribe or manage email preferences
            </a>
        </div>
    </div>
</div>
`;

// --- Salesforce Icon ---
const SalesforceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M16.1 7C16.1 6.3 16 5.6 15.8 5C15.4 3.3 13.9 2 12 2C9.8 2 8 3.8 8 6C8 6.4 8.1 6.8 8.2 7.1C5.2 7.6 3 10.2 3 13.5C3 17.1 5.9 20 9.5 20H16.5C19.5 20 22 17.5 22 14.5C22 11.2 19.4 8.6 16.1 8.5V7Z" />
  </svg>
);

// --- Email Detail View ---
interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEscalate?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({ email, onBack, onDelete, onEscalate, onComplete }) => {
  const [activeLabels, setActiveLabels] = useState<string[]>(email.labels || []);
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Reply/Forward state
  const [composeMode, setComposeMode] = useState<'reply' | 'forward' | null>(null);
  
  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (composeMode || isLabelMenuOpen) return;

      switch(e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          setComposeMode('reply');
          break;
        case 'f':
          e.preventDefault();
          setComposeMode('forward');
          break;
        case 'l':
          e.preventDefault();
          setIsLabelMenuOpen(true);
          break;
        case ' ':
          e.preventDefault();
          if (contentRef.current) {
            contentRef.current.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [composeMode, isLabelMenuOpen]);

  const threadItems = (email.thread || [{
    id: email.id,
    sender: email.sender,
    senderEmail: email.senderEmail,
    recipient: email.recipient,
    body: email.body,
    timestamp: email.timestamp,
    avatarColor: email.avatarColor
  }])
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredLabels = MOCK_LABELS.filter(l => l.toLowerCase().includes(labelSearch.toLowerCase()));

  const toggleLabel = (label: string) => {
    if (activeLabels.includes(label)) {
      setActiveLabels(prev => prev.filter(l => l !== label));
    } else {
      setActiveLabels(prev => [...prev, label]);
    }
  };
  
  const handleComposerSend = (data: any) => {
    console.log('Sent:', data);
    setComposeMode(null);
  };

  const MessageMenu = ({ onReply, onForward, onDeleteMsg }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setIsOpen(!isOpen)}>
          <MoreVertical size={18} />
        </Button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
              <button onClick={() => { onReply(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><CornerUpLeft size={16} /> Reply</button>
              <button onClick={() => { onForward(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><CornerUpRight size={16} /> Forward</button>
              <button onClick={() => { onDeleteMsg(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={16} /> Delete</button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onBack} title="Back">
            <ArrowLeft size={18} />
          </Button>
          
          {/* Label Menu */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)} title="Labels">
              <Tag size={18} />
            </Button>
            {isLabelMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLabelMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">Label as:</p>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        className="w-full pl-7 pr-2 py-1.5 text-sm border-b border-indigo-500 focus:outline-none"
                        value={labelSearch}
                        onChange={(e) => setLabelSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredLabels.map(label => (
                      <label key={label} className="flex items-start px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={activeLabels.includes(label)}
                          onChange={() => toggleLabel(label)}
                        />
                        <span className="ml-2 text-sm text-slate-700 leading-tight">{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-2 px-3">
                    <button className="text-sm text-slate-500 hover:text-indigo-600 w-full text-left py-1">Create new</button>
                    <button className="text-sm text-slate-500 hover:text-indigo-600 w-full text-left py-1">Manage labels</button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => onDelete(email.id)} title="Delete">
            <Trash2 size={18} />
          </Button>
        </div>

        {/* Action Right Side */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#00A1E0]"
            onClick={() => window.open('https://login.salesforce.com', '_blank')}
          >
            <SalesforceIcon className="w-5 h-5 mr-2 text-[#00A1E0]" />
            View Lead
          </Button>

          <Button 
            variant={email.isCompleted ? "secondary" : "outline"}
            size="sm"
            className={cn(
              email.isCompleted 
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                : "text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
            )}
            onClick={() => onComplete && onComplete(email.id)}
          >
            <CheckCircle size={16} className={cn("mr-2", email.isCompleted && "fill-green-200")} />
            {email.isCompleted ? "Completed" : "Complete"}
          </Button>
           
          {email.isEscalated ? (
            <Button 
              variant="danger" 
              size="sm" 
              className="bg-red-50 text-red-600 border border-red-200 shadow-none cursor-default hover:bg-red-50"
              disabled
            >
              <ShieldAlert size={16} className="mr-2" />
              Escalated
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => onEscalate && onEscalate(email.id)}
            >
              <AlertCircle size={16} className="mr-2" />
              Escalate
            </Button>
          )}
        </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 md:p-8 bg-white focus:outline-none" tabIndex={0}>
        <div className="max-w-4xl mx-auto pb-12">
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-xl md:text-2xl font-medium text-slate-900 leading-tight mr-4">{email.subject}</h1>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {activeLabels.map(label => (
                <span key={label} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium self-start">{label}</span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {threadItems.map((item, index) => {
              const isLast = index === threadItems.length - 1;
              return (
                <div key={item.id} className={cn("transition-all", !isLast && "border-b border-slate-100 pb-6 mb-2")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm", item.avatarColor || 'bg-slate-400')}>
                        {item.sender[0]}
                      </div>
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-slate-900">{item.sender}</span>
                          <span className="text-slate-500 text-sm hidden sm:inline">&lt;{item.senderEmail}&gt;</span>
                        </div>
                        <div className="text-xs text-slate-500">to {item.recipient === 'isa@twilio.com' ? 'me' : item.recipient}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {item.senderEmail === 'isa@twilio.com' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => navigate(`/debugger/${email.id}_${item.id}`)}
                          title="Debug this message"
                        >
                          <Bug size={14} className="mr-1.5" /> Debug
                        </Button>
                      )}
                      {isLast && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-yellow-400">
                          <Star size={18} className={email.isStarred ? "fill-yellow-400 text-yellow-400" : ""} />
                        </Button>
                      )}
                      <MessageMenu 
                        onReply={() => setComposeMode('reply')} 
                        onForward={() => setComposeMode('forward')} 
                        onDeleteMsg={() => console.log('delete msg')} 
                      />
                    </div>
                  </div>

                  <div 
                    className={cn("prose prose-slate prose-sm max-w-none text-slate-800 pl-14", !isLast && "text-slate-600")} 
                    dangerouslySetInnerHTML={{ 
                      __html: item.senderEmail === 'isa@twilio.com' 
                        ? item.body + ISA_SIGNATURE 
                        : item.body 
                    }} 
                  />
                </div>
              );
            })}
          </div>
          
          {/* Inline Composer Area */}
          <div className="mt-8 pl-14 transition-all">
            {!composeMode ? (
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2 rounded-full px-6" onClick={() => setComposeMode('reply')}>
                  <CornerUpLeft size={16} /> Reply
                </Button>
                <Button variant="outline" className="flex items-center gap-2 rounded-full px-6" onClick={() => setComposeMode('forward')}>
                  <CornerUpRight size={16} /> Forward
                </Button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {composeMode === 'reply' ? <CornerUpLeft size={14}/> : <CornerUpRight size={14}/>}
                    {composeMode === 'reply' ? `Reply to ${email.sender}` : 'Forward message'}
                  </span>
                  <button onClick={() => setComposeMode(null)}><X size={16} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <MessageComposer 
                  mode={composeMode}
                  defaultTo={composeMode === 'reply' ? [email.senderEmail] : []}
                  defaultSubject={composeMode === 'forward' ? `Fwd: ${email.subject}` : `Re: ${email.subject}`}
                  defaultBody={composeMode === 'forward' ? [
                    { type: 'paragraph', children: [{ text: '' }] },
                    { type: 'paragraph', children: [{ text: '---------- Forwarded message ---------' }] },
                    { type: 'paragraph', children: [{ text: `From: ${email.sender} <${email.senderEmail}>` }] },
                    { type: 'paragraph', children: [{ text: `Date: ${new Date(email.timestamp).toLocaleString()}` }] },
                    { type: 'paragraph', children: [{ text: `Subject: ${email.subject}` }] },
                    { type: 'paragraph', children: [{ text: `To: ${email.recipient}` }] },
                    { type: 'paragraph', children: [{ text: '' }] },
                    { type: 'paragraph', children: [{ text: '...' }] } 
                  ] : undefined}
                  onSend={handleComposerSend}
                  onDiscard={() => setComposeMode(null)}
                  autoFocus
                  className="min-h-[300px]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
