import React from 'react';
import { Inbox as InboxIcon, Send as SendIcon, File as DraftIcon, Trash2, Tag, Star } from 'lucide-react';
import { cn, Button } from '../../../components/UI';
import { FolderType, Email } from '../../../types';
import { MOCK_LABELS } from '../../../services/mockData';

interface SidebarItemProps {
  icon: any;
  label: string;
  type: FolderType;
  count?: number;
  selectedFolder: FolderType;
  onSelect: (type: FolderType) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, type, count, selectedFolder, onSelect }) => (
  <button
    onClick={() => onSelect(type)}
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

interface InboxSidebarProps {
  selectedFolder: FolderType;
  onFolderChange: (type: FolderType) => void;
  onComposeClick: () => void;
  emails: Email[];
}

export const InboxSidebar: React.FC<InboxSidebarProps> = ({ 
  selectedFolder, 
  onFolderChange, 
  onComposeClick,
  emails 
}) => {
  const handleSelectFolder = (type: FolderType) => {
    onFolderChange(type);
  };

  return (
    <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col py-6 px-3 flex-shrink-0 overflow-y-auto">
      <Button 
        className="w-full mb-6 bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-700 justify-start px-4 h-12 rounded-2xl transition-colors flex-shrink-0" 
        onClick={onComposeClick}
      >
        <span className="flex items-center text-lg mr-3">+</span> Compose
      </Button>
      
      <div className="space-y-1 flex-shrink-0">
        <SidebarItem 
          icon={InboxIcon} 
          label="Inbox" 
          type={FolderType.INBOX} 
          count={emails.filter(e => e.folder === FolderType.INBOX && !e.isRead).length}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
        />
        <SidebarItem 
          icon={Star} 
          label="Starred" 
          type={FolderType.INBOX}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
        />
        <SidebarItem 
          icon={SendIcon} 
          label="Sent" 
          type={FolderType.SENT}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
        />
        <SidebarItem 
          icon={DraftIcon} 
          label="Drafts" 
          type={FolderType.DRAFTS} 
          count={emails.filter(e => e.folder === FolderType.DRAFTS).length}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
        />
        <SidebarItem 
          icon={Trash2} 
          label="Trash" 
          type={FolderType.TRASH}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
        />
      </div>

      <div className="mt-8">
        <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Labels</h3>
        <div className="space-y-1">
          {MOCK_LABELS.map(label => (
            <button 
              key={label} 
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg group" 
              title={label}
            >
              <Tag size={16} className="text-slate-400 flex-shrink-0" />
              <span className="truncate text-left">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
