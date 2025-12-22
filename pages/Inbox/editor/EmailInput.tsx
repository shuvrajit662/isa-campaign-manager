import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

// --- Email Input Component ---
interface EmailInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  label: string;
  autoFocus?: boolean;
  rightElement?: React.ReactNode;
}

export const EmailInput: React.FC<EmailInputProps> = ({ 
  recipients, 
  onChange, 
  label, 
  autoFocus, 
  rightElement 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ',', ' '].includes(e.key)) {
      e.preventDefault();
      const val = inputValue.trim();
      if (val) {
        onChange([...recipients, val]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  const removeRecipient = (index: number) => {
    onChange(recipients.filter((_, i) => i !== index));
  };

  return (
    <div 
      className="flex items-start px-4 border-b border-slate-100 group focus-within:bg-indigo-50/30 transition-colors flex-shrink-0 min-h-[48px] py-1" 
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-slate-500 text-sm font-medium w-16 pt-2 select-none">{label}</span>
      <div className="flex-1 flex flex-wrap gap-2 items-center min-w-0 py-1">
        {recipients.map((email, index) => (
          <div key={index} className="flex items-center bg-indigo-100 text-indigo-800 text-sm rounded-full px-2 py-0.5 border border-indigo-200">
            <span className="max-w-[200px] truncate">{email}</span>
            <button onClick={(e) => { e.stopPropagation(); removeRecipient(index); }} className="ml-1 text-indigo-400 hover:text-indigo-600 rounded-full p-0.5">
              <X size={12} />
            </button>
          </div>
        ))}
        <input 
          ref={inputRef}
          className="flex-1 bg-transparent focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 min-w-[120px] py-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) { onChange([...recipients, inputValue.trim()]); setInputValue(''); } }}
          autoFocus={autoFocus}
          placeholder={recipients.length === 0 ? "Recipients" : ""}
        />
      </div>
      {rightElement && <div className="ml-2 pt-2">{rightElement}</div>}
    </div>
  );
};
