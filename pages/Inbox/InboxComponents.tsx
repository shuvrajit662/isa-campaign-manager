
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createEditor, Element as SlateElement, Transforms, Text, Range, Editor } from 'slate';
import { Slate, Editable, withReact, useSelected, useFocused, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { useNavigate } from 'react-router-dom';
import isHotkey from 'is-hotkey';
import { ArrowLeft, Star, Trash2, Reply, MoreVertical, Paperclip, Send, X, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Check, ExternalLink, FileDown, Tag, Search, Forward, ChevronDown, CornerUpLeft, CornerUpRight, AlertCircle, ShieldAlert, Bug } from 'lucide-react';
import { Email } from '../../types';
import { Button, cn, Input } from '../../components/UI';
import { MOCK_LABELS } from '../../services/mockData';

// --- Types for Slate ---
type CustomText = { 
  text: string; 
  bold?: boolean; 
  italic?: boolean; 
  underline?: boolean;
  fontSize?: string;
  fontFamily?: string;
}

type CustomElement = { 
  type: 'paragraph' | 'list-item' | 'bulleted-list' | 'numbered-list' | 'link'; 
  align?: 'left' | 'center' | 'right' | 'justify';
  url?: string;
  children: CustomText[] | CustomElement[];
}

// --- Constants ---
const FONT_FAMILIES = [
  { label: 'Sans Serif (Default)', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif (Default)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Monospace (Default)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { label: 'Roboto', value: '"Roboto", sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Lato', value: '"Lato", sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Poppins', value: '"Poppins", sans-serif' },
  { label: 'Oswald', value: '"Oswald", sans-serif' },
  { label: 'Raleway', value: '"Raleway", sans-serif' },
  { label: 'Nunito', value: '"Nunito", sans-serif' },
  { label: 'Noto Sans', value: '"Noto Sans", sans-serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", sans-serif' },
  { label: 'Rubik', value: '"Rubik", sans-serif' },
  { label: 'PT Sans', value: '"PT Sans", sans-serif' },
  { label: 'Merriweather', value: '"Merriweather", serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Courier Prime', value: '"Courier Prime", monospace' },
  { label: 'Inconsolata', value: '"Inconsolata", monospace' },
];

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Large', value: '18px' },
  { label: 'Huge', value: '24px' },
];

// --- Plugins ---
const withInlines = (editor: Editor) => {
  const { isInline } = editor;
  editor.isInline = element => 
    ['link'].includes((element as any).type) || isInline(element);
  return editor;
};

// --- Serializer (Slate JSON -> HTML String) ---
const serialize = (node: any): string => {
  if (Text.isText(node)) {
    let string = node.text;
    if (node.bold) string = `<strong>${string}</strong>`;
    if (node.italic) string = `<em>${string}</em>`;
    if (node.underline) string = `<u>${string}</u>`;
    
    const styles: string[] = [];
    if (node.fontSize) styles.push(`font-size:${node.fontSize}`);
    if (node.fontFamily) styles.push(`font-family:${node.fontFamily}`);
    
    if (styles.length > 0) {
      return `<span style="${styles.join(';')}">${string}</span>`;
    }
    return string;
  }

  const children = node.children.map((n: any) => serialize(n)).join('');
  const styleAttr = node.align ? `style="text-align:${node.align}"` : '';

  switch (node.type) {
    case 'paragraph':
      return `<p ${styleAttr}>${children}</p>`;
    case 'list-item':
      return `<li ${styleAttr}>${children}</li>`;
    case 'bulleted-list':
      return `<ul ${styleAttr}>${children}</ul>`;
    case 'numbered-list':
      return `<ol ${styleAttr}>${children}</ol>`;
    case 'link':
      return `<a href="${node.url}" target="_blank" rel="noopener noreferrer" ${styleAttr} style="color:#2563eb;text-decoration:underline">${children}</a>`;
    default:
      return children;
  }
};

// --- Slate Helpers ---
const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const getMarkValue = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] : undefined;
};

const setMarkValue = (editor: Editor, format: string, value: string) => {
  Editor.addMark(editor, format, value);
};

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
    })
  );
  return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'bulleted-list' || format === 'numbered-list';
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['bulleted-list', 'numbered-list'].includes((n as any).type),
    split: true,
  });
  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : (format as any),
  };
  Transforms.setNodes(editor, newProperties);
  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const isAlignActive = (editor: Editor, align: string) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).align === align,
    })
  );
  return !!match;
};

const toggleAlign = (editor: Editor, align: string) => {
  Transforms.setNodes(editor, { align } as any);
};

const isLinkActive = (editor: Editor) => {
  const [link] = Array.from(Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'link',
  }));
  return !!link;
};

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'link',
  });
};

const wrapLink = (editor: Editor, url: string) => {
  if (isLinkActive(editor)) unwrapLink(editor);
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: CustomElement = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };
  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

const insertLink = (editor: Editor, url: string) => {
  if (editor.selection) wrapLink(editor, url);
};

// --- Toolbar Button Component ---
const ToolbarButton = ({ format, align, icon: Icon, active, onMouseDown, title }: { format?: string, align?: string, icon: any, active?: boolean, onMouseDown: (e: React.MouseEvent) => void, title?: string }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0 hover:bg-indigo-50", active ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600")}
      onMouseDown={onMouseDown}
      title={title || format || align}
    >
      <Icon size={16} />
    </Button>
  );
};

// --- Renderers ---
const Element = ({ attributes, children, element }: any) => {
  const style = { textAlign: element.align };
  const selected = useSelected();
  const focused = useFocused();
  
  switch (element.type) {
    case 'bulleted-list': return <ul {...attributes} style={style} className="list-disc pl-5 mb-2">{children}</ul>;
    case 'numbered-list': return <ol {...attributes} style={style} className="list-decimal pl-5 mb-2">{children}</ol>;
    case 'list-item': return <li {...attributes} style={style}>{children}</li>;
    case 'link':
      return (
        <span className="relative inline-block">
          <a {...attributes} href={element.url} className="text-indigo-600 underline cursor-pointer hover:text-indigo-800" style={style}>{children}</a>
          {selected && focused && (
            <div contentEditable={false} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 bg-white border border-slate-200 shadow-lg rounded-md px-3 py-2 flex items-center gap-2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs text-slate-500 max-w-[150px] truncate">{element.url}</span>
              <div className="h-3 w-px bg-slate-200" />
              <a href={element.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1" onMouseDown={(e) => { e.preventDefault(); window.open(element.url, '_blank'); }}>
                Open <ExternalLink size={10} />
              </a>
            </div>
          )}
        </span>
      );
    default: return <p {...attributes} style={style} className="mb-2">{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  const style: React.CSSProperties = {};
  if (leaf.fontSize) style.fontSize = leaf.fontSize;
  if (leaf.fontFamily) style.fontFamily = leaf.fontFamily;
  return <span {...attributes} style={style}>{children}</span>;
};

// --- Email Input Component ---
interface EmailInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  label: string;
  autoFocus?: boolean;
  rightElement?: React.ReactNode;
}

const EmailInput: React.FC<EmailInputProps> = ({ recipients, onChange, label, autoFocus, rightElement }) => {
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
    <div className="flex items-start px-4 border-b border-slate-100 group focus-within:bg-indigo-50/30 transition-colors flex-shrink-0 min-h-[48px] py-1" onClick={() => inputRef.current?.focus()}>
      <span className="text-slate-500 text-sm font-medium w-16 pt-2 select-none">{label}</span>
      <div className="flex-1 flex flex-wrap gap-2 items-center min-w-0 py-1">
        {recipients.map((email, index) => (
          <div key={index} className="flex items-center bg-indigo-100 text-indigo-800 text-sm rounded-full px-2 py-0.5 border border-indigo-200">
            <span className="max-w-[200px] truncate">{email}</span>
            <button onClick={(e) => { e.stopPropagation(); removeRecipient(index); }} className="ml-1 text-indigo-400 hover:text-indigo-600 rounded-full p-0.5"><X size={12} /></button>
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

// --- Reusable Message Composer ---
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

const MessageComposer: React.FC<MessageComposerProps> = ({ 
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
  
  const editor = useMemo(() => withInlines(withHistory(withReact(createEditor()))), []);
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
             <EmailInput label="Cc" recipients={ccRecipients} onChange={setCcRecipients} rightElement={<button onClick={() => { setShowCc(false); setCcRecipients([]); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>} />
          )}
          {showBcc && (
             <EmailInput label="Bcc" recipients={bccRecipients} onChange={setBccRecipients} rightElement={<button onClick={() => { setShowBcc(false); setBccRecipients([]); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>} />
          )}
          <div className="flex items-center px-4 border-b border-slate-100 group focus-within:bg-indigo-50/30 transition-colors flex-shrink-0">
             <span className="text-slate-500 text-sm font-medium w-16">Subject</span>
             <input className="flex-1 py-3 bg-transparent focus:outline-none text-sm text-slate-900 font-medium placeholder:font-normal placeholder:text-slate-400" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </>
      )}

      <Slate editor={editor} initialValue={initialValue} onChange={val => setValue(val)}>
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white flex-shrink-0 z-10 relative">
            <select className="h-8 text-xs border-r border-slate-100 outline-none bg-transparent cursor-pointer text-slate-600 hover:text-indigo-600 mr-1 max-w-[120px]" onChange={e => setMarkValue(editor, 'fontFamily', e.target.value)} value={getMarkValue(editor, 'fontFamily') || 'sans-serif'}>
               {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
            </select>
            <select className="h-8 text-xs border-r border-slate-100 outline-none bg-transparent cursor-pointer text-slate-600 hover:text-indigo-600 mr-2" onChange={e => setMarkValue(editor, 'fontSize', e.target.value)} value={getMarkValue(editor, 'fontSize') || '14px'}>
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
                  <input className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsertLink(); }}} autoFocus />
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
          <Editable renderElement={renderElement} renderLeaf={renderLeaf} placeholder="Write your message here..." className="min-h-full focus:outline-none prose prose-slate prose-sm max-w-none" spellCheck onKeyDown={event => { for (const hotkey in HOTKEYS) { if (isHotkey(hotkey, event as any)) { event.preventDefault(); const mark = HOTKEYS[hotkey]; toggleMark(editor, mark); }}}} />
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

// --- Email Detail View ---
interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEscalate?: (id: string) => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({ email, onBack, onDelete, onEscalate }) => {
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
      // Ignore if input/textarea is focused
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      
      // Ignore shortcuts if we are in compose mode or a menu is open
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

  const threadItems = email.thread || [{
    id: email.id,
    sender: email.sender,
    senderEmail: email.senderEmail,
    recipient: email.recipient,
    body: email.body,
    timestamp: email.timestamp,
    avatarColor: email.avatarColor
  }];

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
                              onClick={() => navigate('/debugger')}
                              title="Debug this message"
                           >
                              <Bug size={14} className="mr-1.5" /> Debug
                           </Button>
                         )}
                         {isLast && (
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-yellow-400"><Star size={18} className={email.isStarred ? "fill-yellow-400 text-yellow-400" : ""} /></Button>
                         )}
                         <MessageMenu 
                            onReply={() => setComposeMode('reply')} 
                            onForward={() => setComposeMode('forward')} 
                            onDeleteMsg={() => console.log('delete msg')} 
                         />
                      </div>
                   </div>

                   <div className={cn("prose prose-slate prose-sm max-w-none text-slate-800 pl-14", !isLast && "text-slate-600")} dangerouslySetInnerHTML={{ __html: item.body }} />
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
                      // Note: converting HTML body back to slate is complex, simplifying here
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
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-slate-300 hover:text-white"><X size={16} /></button>
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
