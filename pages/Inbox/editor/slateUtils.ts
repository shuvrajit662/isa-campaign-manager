import { createEditor, Element as SlateElement, Transforms, Text, Range, Editor, BaseEditor, Descendant } from 'slate';
import { withReact, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';

// --- Types for Slate ---
export type CustomText = { 
  text: string; 
  bold?: boolean; 
  italic?: boolean; 
  underline?: boolean;
  fontSize?: string;
  fontFamily?: string;
}

export type CustomElement = { 
  type: 'paragraph' | 'list-item' | 'bulleted-list' | 'numbered-list' | 'link'; 
  align?: 'left' | 'center' | 'right' | 'justify';
  url?: string;
  children: (CustomText | CustomElement)[];
}

// Extend Slate types
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// --- Plugins ---
export const withInlines = (editor: CustomEditor): CustomEditor => {
  const { isInline } = editor;
  editor.isInline = element => 
    ['link'].includes(element.type) || isInline(element);
  return editor;
};

export const createSlateEditor = (): CustomEditor => withInlines(withHistory(withReact(createEditor())));

// --- Serializer (Slate JSON -> HTML String) ---
export const serialize = (node: CustomText | CustomElement | { children: (CustomText | CustomElement)[] }): string => {
  if (Text.isText(node)) {
    const textNode = node as CustomText;
    let string = textNode.text;
    if (textNode.bold) string = `<strong>${string}</strong>`;
    if (textNode.italic) string = `<em>${string}</em>`;
    if (textNode.underline) string = `<u>${string}</u>`;
    
    const styles: string[] = [];
    if (textNode.fontSize) styles.push(`font-size:${textNode.fontSize}`);
    if (textNode.fontFamily) styles.push(`font-family:${textNode.fontFamily}`);
    
    if (styles.length > 0) {
      return `<span style="${styles.join(';')}">${string}</span>`;
    }
    return string;
  }

  const elementNode = node as CustomElement;
  const children = elementNode.children.map((n) => serialize(n)).join('');
  const styleAttr = elementNode.align ? `style="text-align:${elementNode.align}"` : '';

  switch (elementNode.type) {
    case 'paragraph':
      return `<p ${styleAttr}>${children}</p>`;
    case 'list-item':
      return `<li ${styleAttr}>${children}</li>`;
    case 'bulleted-list':
      return `<ul ${styleAttr}>${children}</ul>`;
    case 'numbered-list':
      return `<ol ${styleAttr}>${children}</ol>`;
    case 'link':
      return `<a href="${elementNode.url}" target="_blank" rel="noopener noreferrer" ${styleAttr} style="color:#2563eb;text-decoration:underline">${children}</a>`;
    default:
      return children;
  }
};

// --- Slate Helpers ---
export const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};

export const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, boolean>)[format] === true : false;
};

export const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const getMarkValue = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, string>)[format] : undefined;
};

export const setMarkValue = (editor: CustomEditor, format: string, value: string) => {
  Editor.addMark(editor, format, value);
};

export const isBlockActive = (editor: CustomEditor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === format,
    })
  );
  return !!match;
};

export const toggleBlock = (editor: CustomEditor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'bulleted-list' || format === 'numbered-list';
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['bulleted-list', 'numbered-list'].includes((n as CustomElement).type),
    split: true,
  });
  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : (format as CustomElement['type']),
  };
  Transforms.setNodes(editor, newProperties);
  if (!isActive && isList) {
    const block: CustomElement = { type: format as CustomElement['type'], children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export const isAlignActive = (editor: CustomEditor, align: string) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).align === align,
    })
  );
  return !!match;
};

export const toggleAlign = (editor: CustomEditor, align: string) => {
  Transforms.setNodes(editor, { align } as Partial<CustomElement>);
};

export const isLinkActive = (editor: CustomEditor) => {
  const [link] = Array.from(Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === 'link',
  }));
  return !!link;
};

export const unwrapLink = (editor: CustomEditor) => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === 'link',
  });
};

export const wrapLink = (editor: CustomEditor, url: string) => {
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

export const insertLink = (editor: CustomEditor, url: string) => {
  if (editor.selection) wrapLink(editor, url);
};
