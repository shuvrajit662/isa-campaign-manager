import React from 'react';
import { Modal } from '../../../components/UI';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          <span className="text-slate-600">Previous / Next Page</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">←</kbd>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">→</kbd>
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
  );
};
