import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Slate, Editable, ReactEditor } from 'slate-react';
import isHotkey from 'is-hotkey';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Paperclip, Send, X, Check, FileDown, Trash2 
} from 'lucide-react';
import { Button, cn } from '../../components/UI';
import { 
  createSlateEditor, serialize, HOTKEYS,
  isMarkActive, toggleMark, getMarkValue, setMarkValue,
  isBlockActive, toggleBlock, isAlignActive, toggleAlign, 
  isLinkActive, insertLink,
  FONT_FAMILIES, FONT_SIZES,
  ToolbarButton, Element, Leaf, EmailInput
} from './editor';

interface MessageComposerProps {
  defaultTo?: string[];
  defaultCc?: string[];
  defaultBcc?: string[];
  defaultSubject?: string;
  defaultBody?: any[]; // Slate content
  mode: 'compose' | 'reply' | 'forward';
  onSend: (data: { to: string[], cc: string[], bcc: string[], subject: string, body: string }) => void;
  onDiscard?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
  defaultTo = [], defaultCc = [], defaultBcc = [], defaultSubject = '', defaultBody, 
  mode, onSend, onDiscard, className, autoFocus 
}) => {
  const [toRecipients, setToRecipients] = useState<string[]>(defaultTo);
  const [ccRecipients, setCcRecipients] = useState<string[]>(defaultCc);
  const [bccRecipients, setBccRecipients] = useState<string[]>(defaultBcc);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(defaultBcc.length > 0);
  const [subject, setSubject] = useState(defaultSubject);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const editor = useMemo(() => createSlateEditor(), []);
  const initialValue = defaultBody || [{ type: 'paragraph', children: [{ text: '' }] }];
  const [value, setValue] = useState<any[]>(initialValue);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  const handleSend = () => {
    const htmlBody = value.map(n => serialize(n)).join('');
    onSend({ 
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject,
      body: htmlBody 
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      insertLink(editor, linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {mode !== 'reply' && (
        <>
          <EmailInput 
            label="To"
            recipients={toRecipients}
            onChange={setToRecipients}
            autoFocus={autoFocus}
            rightElement={(!showCc || !showBcc) && (
              <div className="flex space-x-2">
                {!showCc && <button onClick={() => setShowCc(true)} className="text-slate-500 hover:text-slate-800 text-xs font-medium px-1">Cc</button>}
                {!showBcc && <button onClick={() => setShowBcc(true)} className="text-slate-500 hover:text-slate-800 text-xs font-medium px-1">Bcc</button>}
              </div>
            )}
          />
          {showCc && (
            <EmailInput 
              label="Cc" 
              recipients={ccRecipients} 
              onChange={setCcRecipients} 
              rightElement={<button onClick={() => { setShowCc(false); setCcRecipients([]); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>} 
            />
          )}
          {showBcc && (
            <EmailInput 
              label="Bcc" 
              recipients={bccRecipients} 
              onChange={setBccRecipients} 
              rightElement={<button onClick={() => { setShowBcc(false); setBccRecipients([]); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>} 
            />
          )}
          <div className="flex items-center px-4 border-b border-slate-100 group focus-within:bg-indigo-50/30 transition-colors flex-shrink-0">
            <span className="text-slate-500 text-sm font-medium w-16">Subject</span>
            <input 
              className="flex-1 py-3 bg-transparent focus:outline-none text-sm text-slate-900 font-medium placeholder:font-normal placeholder:text-slate-400" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
            />
          </div>
        </>
      )}

      <Slate editor={editor} initialValue={initialValue} onChange={val => setValue(val)}>
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white flex-shrink-0 z-10 relative">
          <select 
            className="h-8 text-xs border-r border-slate-100 outline-none bg-transparent cursor-pointer text-slate-600 hover:text-indigo-600 mr-1 max-w-[120px]" 
            onChange={e => setMarkValue(editor, 'fontFamily', e.target.value)} 
            value={getMarkValue(editor, 'fontFamily') || 'sans-serif'}
          >
            {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>
          <select 
            className="h-8 text-xs border-r border-slate-100 outline-none bg-transparent cursor-pointer text-slate-600 hover:text-indigo-600 mr-2" 
            onChange={e => setMarkValue(editor, 'fontSize', e.target.value)} 
            value={getMarkValue(editor, 'fontSize') || '14px'}
          >
            {FONT_SIZES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <ToolbarButton format="bold" icon={Bold} active={isMarkActive(editor, 'bold')} onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'bold'); }} />
          <ToolbarButton format="italic" icon={Italic} active={isMarkActive(editor, 'italic')} onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'italic'); }} />
          <ToolbarButton format="underline" icon={Underline} active={isMarkActive(editor, 'underline')} onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'underline'); }} />
          <div className="relative">
            <ToolbarButton icon={LinkIcon} active={isLinkActive(editor) || showLinkInput} title="Insert Link" onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(!showLinkInput); }} />
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input 
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
                  placeholder="https://..." 
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsertLink(); }}} 
                  autoFocus 
                />
                <Button size="sm" className="h-7 px-2" onClick={handleInsertLink}><Check size={14} /></Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-500" onClick={() => setShowLinkInput(false)}><X size={14} /></Button>
              </div>
            )}
          </div>
          <ToolbarButton icon={Paperclip} title="Attach files" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }} />
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <ToolbarButton align="left" icon={AlignLeft} active={isAlignActive(editor, 'left')} onMouseDown={(e) => { e.preventDefault(); toggleAlign(editor, 'left'); }} />
          <ToolbarButton align="center" icon={AlignCenter} active={isAlignActive(editor, 'center')} onMouseDown={(e) => { e.preventDefault(); toggleAlign(editor, 'center'); }} />
          <ToolbarButton align="right" icon={AlignRight} active={isAlignActive(editor, 'right')} onMouseDown={(e) => { e.preventDefault(); toggleAlign(editor, 'right'); }} />
          <ToolbarButton align="justify" icon={AlignJustify} active={isAlignActive(editor, 'justify')} onMouseDown={(e) => { e.preventDefault(); toggleAlign(editor, 'justify'); }} />
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <ToolbarButton format="bulleted-list" icon={List} active={isBlockActive(editor, 'bulleted-list')} onMouseDown={(e) => { e.preventDefault(); toggleBlock(editor, 'bulleted-list'); }} />
          <ToolbarButton format="numbered-list" icon={ListOrdered} active={isBlockActive(editor, 'numbered-list')} onMouseDown={(e) => { e.preventDefault(); toggleBlock(editor, 'numbered-list'); }} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 cursor-text bg-white" onClick={() => ReactEditor.focus(editor)}>
          <Editable 
            renderElement={renderElement} 
            renderLeaf={renderLeaf} 
            placeholder="Write your message here..." 
            className="min-h-full focus:outline-none prose prose-slate prose-sm max-w-none" 
            spellCheck 
            onKeyDown={event => { 
              for (const hotkey in HOTKEYS) { 
                if (isHotkey(hotkey, event as any)) { 
                  event.preventDefault(); 
                  const mark = HOTKEYS[hotkey]; 
                  toggleMark(editor, mark); 
                }
              }
            }} 
          />
        </div>
      </Slate>

      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-white border border-slate-200 text-slate-700 text-xs rounded-full px-3 py-1 shadow-sm group">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <span className="ml-1 text-slate-400">({(file.size / 1024).toFixed(0)}KB)</span>
              <button onClick={() => removeAttachment(index)} className="ml-2 text-slate-400 hover:text-red-500 focus:outline-none"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 flex items-center justify-between border-t border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-9 shadow-sm hover:shadow transition-all">Send <Send size={14} className="ml-2" /></Button>
          <Button variant="secondary" onClick={() => console.log('Draft saved')} className="rounded-full px-4 h-9 shadow-sm hover:shadow transition-all text-slate-600">Draft <FileDown size={14} className="ml-2" /></Button>
          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        </div>
        {onDiscard && <Button variant="ghost" size="icon" onClick={onDiscard} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"><Trash2 size={18} /></Button>}
      </div>
    </div>
  );
};
