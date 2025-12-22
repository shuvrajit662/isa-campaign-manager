import React from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Keyboard, Filter } from 'lucide-react';
import { Button, cn } from '../../../components/UI';
import { FolderType } from '../../../types';
import { MOCK_CAMPAIGNS } from '../../../services/mockData';

interface InboxHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFolder: FolderType;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIdx: number;
  endIdx: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  
  // Campaign filter
  selectedCampaignId: string;
  onCampaignChange: (id: string) => void;
  
  // Actions
  isLoading: boolean;
  onRefresh: () => void;
  onShortcutsClick: () => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedFolder,
  currentPage,
  totalPages,
  totalItems,
  startIdx,
  endIdx,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedCampaignId,
  onCampaignChange,
  isLoading,
  onRefresh,
  onShortcutsClick,
}) => {
  return (
    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0 gap-4">
      <div className="relative max-w-lg w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder={`Search in ${selectedFolder}...`}
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-3">
        {/* Pagination Controls */}
        <div className="flex items-center text-sm text-slate-500 mr-2 border-r border-slate-200 pr-4 space-x-3">
          <span className="hidden xl:inline text-xs font-medium">
            {totalItems > 0 ? `${startIdx + 1}-${endIdx} of ${totalItems}` : '0'}
          </span>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              disabled={currentPage <= 1} 
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              disabled={currentPage >= totalPages} 
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          <select 
            className="bg-transparent border-none text-slate-700 font-medium text-xs focus:ring-0 cursor-pointer outline-none hover:text-indigo-600"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-slate-400 hover:text-slate-600", isLoading && "animate-spin")}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCw size={20} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-slate-600"
          onClick={onShortcutsClick}
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
            value={selectedCampaignId}
            onChange={(e) => onCampaignChange(e.target.value)}
            disabled={isLoading}
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
  );
};
