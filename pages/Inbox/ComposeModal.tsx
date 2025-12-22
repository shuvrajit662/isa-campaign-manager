import React from 'react';
import { X } from 'lucide-react';
import { Email } from '../../types';
import { MessageComposer } from './MessageComposer';

// --- Compose Modal Wrapper ---
interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: Partial<Email>) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-24 z-50 w-[640px] h-[75vh] bg-white rounded-t-lg shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-5 duration-200 ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white rounded-t-lg select-none cursor-pointer flex-shrink-0" onClick={onClose}>
        <h3 className="font-medium text-sm pl-1">New Message</h3>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-slate-300 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <MessageComposer 
        mode="compose"
        onSend={(data) => {
          onSend({ recipient: data.to.join(', '), subject: data.subject, body: data.body });
        }}
        onDiscard={onClose}
        autoFocus
      />
    </div>
  );
};
