import React from 'react';
import { useSelected, useFocused } from 'slate-react';
import { ExternalLink } from 'lucide-react';
import { Button, cn } from '../../../components/UI';

// --- Toolbar Button Component ---
interface ToolbarButtonProps {
  format?: string;
  align?: string;
  icon: any;
  active?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  title?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  format, 
  align, 
  icon: Icon, 
  active, 
  onMouseDown, 
  title 
}) => {
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
export const Element = ({ attributes, children, element }: any) => {
  const style = { textAlign: element.align };
  const selected = useSelected();
  const focused = useFocused();
  
  switch (element.type) {
    case 'bulleted-list': 
      return <ul {...attributes} style={style} className="list-disc pl-5 mb-2">{children}</ul>;
    case 'numbered-list': 
      return <ol {...attributes} style={style} className="list-decimal pl-5 mb-2">{children}</ol>;
    case 'list-item': 
      return <li {...attributes} style={style}>{children}</li>;
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
    default: 
      return <p {...attributes} style={style} className="mb-2">{children}</p>;
  }
};

export const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  const style: React.CSSProperties = {};
  if (leaf.fontSize) style.fontSize = leaf.fontSize;
  if (leaf.fontFamily) style.fontFamily = leaf.fontFamily;
  return <span {...attributes} style={style}>{children}</span>;
};
