

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { MOCK_TEST_EXECUTIONS } from '../../services/mockData';
import { Button, Input, Badge, cn } from '../../components/UI';

export const TestExecutions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = MOCK_TEST_EXECUTIONS.filter(item => 
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.conversationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.messageId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleRowClick = (conversationId: string) => {
    navigate(`/debugger/${conversationId}`, { state: { isTest: true } });
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <History className="text-slate-400" size={32} />
              Test Executions
            </h1>
            <p className="text-slate-500 mt-2">History of system traces and assistant runs.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                className="pl-9 h-10 bg-white" 
                placeholder="Search by email, Conversation ID, or Message ID..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <select 
                className="border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Execution Type</th>
                  <th className="px-6 py-4">IDs</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentData.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                        No executions found matching your search.
                     </td>
                   </tr>
                ) : (
                  currentData.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(item.conversationId)}
                    >
                      <td className="px-6 py-4">
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Success"></div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{item.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex">
                          {item.executionType === 'Full Trace' ? (
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200">
                              <History size={12} className="mr-1.5" /> Full Trace
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
                              <Play size={12} className="mr-1.5 fill-slate-500 text-slate-500" /> Assistant Run: <span className="font-semibold ml-1">{item.assistantName}</span>
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                               <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 max-w-[120px] truncate" title={item.conversationId}>
                                 {item.conversationId.substring(0, 12)}...
                               </span>
                               <span className="text-slate-400">Conv ID</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                               <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 max-w-[120px] truncate" title={item.messageId}>
                                 {item.messageId}
                               </span>
                               <span className="text-slate-400">Msg ID</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs tabular-nums">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-600">
            <div>
              Showing <span className="font-medium">{filteredData.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(startIndex + pageSize, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                   <button
                     key={page}
                     onClick={() => setCurrentPage(page)}
                     className={cn(
                       "w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                       currentPage === page 
                         ? "bg-indigo-600 text-white shadow-sm" 
                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                     )}
                   >
                     {page}
                   </button>
                ))}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};