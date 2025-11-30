import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Copy, Save, X } from 'lucide-react';
import { MOCK_PROMPTS } from '../../services/mockData';
import { Prompt } from '../../types';
import { Button, Input, Modal, Badge } from '../../components/UI';

export const PromptLibrary = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = () => {
    if (!editingPrompt?.title || !editingPrompt?.content) return;

    if (editingPrompt.id) {
      // Update
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, ...editingPrompt } as Prompt : p));
    } else {
      // Create
      const newPrompt: Prompt = {
        id: `p-${Date.now()}`,
        title: editingPrompt.title,
        content: editingPrompt.content,
        tags: editingPrompt.tags || [],
        lastEdited: new Date().toISOString()
      };
      setPrompts(prev => [newPrompt, ...prev]);
    }
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt({ ...prompt });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingPrompt({ title: '', content: '', tags: [] });
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Prompt Library</h1>
            <p className="text-slate-500 mt-2">Manage your email templates and AI prompts.</p>
          </div>
          <Button onClick={openNew} className="shadow-lg shadow-indigo-200">
            <Plus size={18} className="mr-2" /> New Prompt
          </Button>
        </div>

        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            className="pl-10 h-12 text-base shadow-sm"
            placeholder="Search prompts by name or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-64">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1" title={prompt.title}>{prompt.title}</h3>
                <div className="flex space-x-1">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(prompt)} className="h-8 w-8">
                      <Edit2 size={14} />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(prompt.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={14} />
                   </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-md p-3 mb-4 flex-1 overflow-hidden border border-slate-100">
                <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap">{prompt.content.substring(0, 150)}...</p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(prompt.lastEdited).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          
          {/* Add New Card Placeholder */}
          <div 
            onClick={openNew}
            className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer h-64"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white">
              <Plus size={24} />
            </div>
            <span className="font-medium">Create New Prompt</span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPrompt?.id ? "Edit Prompt" : "Create Prompt"}
        className="max-w-2xl"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editingPrompt?.title || !editingPrompt?.content}>
              <Save size={16} className="mr-2" /> Save Prompt
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prompt Title</label>
            <Input 
              value={editingPrompt?.title || ''} 
              onChange={e => setEditingPrompt(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Cold Outreach Sequence 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <div className="relative">
              <textarea 
                className="w-full h-64 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                value={editingPrompt?.content || ''}
                onChange={e => setEditingPrompt(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Hi {{name}}, ..."
              />
              <div className="absolute top-2 right-2">
                <Button size="sm" variant="ghost" title="Copy to clipboard" onClick={() => {
                  navigator.clipboard.writeText(editingPrompt?.content || '');
                }}>
                  <Copy size={14} />
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Use <code>{`{{variable}}`}</code> for dynamic insertions.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
            <Input 
              value={editingPrompt?.tags?.join(', ') || ''} 
              onChange={e => setEditingPrompt(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="Sales, Follow-up, Intro"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
