import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Edit2, Save } from 'lucide-react';
import { APIPrompt } from '../../types';
import { fetchPrompts, updatePrompt } from '../../services/api';
import { Button, Badge, Modal } from '../../components/UI';
import { LoadingState, ErrorState, EmptyState } from '../../components/shared';

const PAGE_SIZE = 10;

export const Prompts = () => {
  const [prompts, setPrompts] = useState<APIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<APIPrompt | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTemplate, setEditedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetchPrompts({ offset, limit: PAGE_SIZE });
      
      console.log('API Response:', response);
      
      // Handle response structure
      if (response.prompts && Array.isArray(response.prompts)) {
        setPrompts(response.prompts);
      } else {
        setPrompts([]);
      }
      
      // Safely access pagination properties - check both 'page' and 'pagination' fields
      const pageInfo = response.page || response.pagination;
      if (pageInfo) {
        const total = pageInfo.total || 0;
        const currentOffset = pageInfo.offset || offset;
        const currentLimit = pageInfo.limit || PAGE_SIZE;
        
        setTotalCount(total);
        // Calculate if there are more pages
        const calculatedHasMore = (currentOffset + currentLimit) < total;
        setHasMore(calculatedHasMore);
      } else {
        // Fallback if pagination is not provided
        setTotalCount(response.prompts?.length || 0);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const canGoNext = hasMore || (totalCount > 0 && currentPage < totalPages);
    if (canGoNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleEdit = (prompt: APIPrompt) => {
    setEditingPrompt(prompt);
    setEditedDescription(prompt.description || '');
    setEditedTemplate(prompt.template || '');
  };

  const handleCloseModal = () => {
    setEditingPrompt(null);
    setEditedDescription('');
    setEditedTemplate('');
  };

  const handleSave = async () => {
    if (!editingPrompt) return;

    try {
      setIsSaving(true);
      await updatePrompt(editingPrompt.id, {
        description: editedDescription,
        template: editedTemplate,
      });
      
      // Update the prompt in the list
      setPrompts(prompts.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, description: editedDescription, template: editedTemplate }
          : p
      ));
      
      handleCloseModal();
    } catch (err) {
      console.error('Error updating prompt:', err);
      alert(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && prompts.length === 0) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Prompts</h1>
              <p className="text-slate-500 mt-1">Browse and manage AI prompts</p>
            </div>
            
            {/* Pagination Controls at Top */}
            {prompts.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  {totalCount > 0 ? (
                    <span>
                      Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
                    </span>
                  ) : (
                    <span>
                      Page {currentPage} • {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    size="sm"
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-slate-600 px-2">
                      Page {currentPage}
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={handleNextPage}
                    disabled={!hasMore && (!totalCount || currentPage >= totalPages)}
                    size="sm"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {prompts.length === 0 && !loading ? (
          <EmptyState 
            icon={FileText}
            title="No prompts found"
            message="No prompts available"
          />
        ) : (
          <div className="space-y-4">
            {prompts.map(prompt => (
              <div 
                key={prompt.id} 
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg text-slate-900">{prompt.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {prompt.type}
                      </Badge>
                      {prompt.isActive === false && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-slate-600 mb-3">{prompt.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(prompt)}
                    className="ml-2"
                  >
                    <Edit2 size={16} />
                  </Button>
                </div>

                <div className="bg-slate-50 rounded-md p-4 mb-4 border border-slate-100">
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                    {prompt.template}
                  </pre>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map(tag => (
                      <Badge 
                        key={tag.id} 
                        variant="secondary"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  {prompt.version && (
                    <span className="text-xs text-slate-400">
                      v{prompt.version}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPrompt && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Edit: ${editingPrompt.name}`}
          className="max-w-3xl"
          footer={
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                rows={2}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter prompt description..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template
              </label>
              <textarea
                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                rows={12}
                value={editedTemplate}
                onChange={(e) => setEditedTemplate(e.target.value)}
                placeholder="Enter prompt template..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Use <code>{"{{variable}}"}</code> for dynamic insertions.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
