export { 
  createSlateEditor,
  serialize,
  HOTKEYS,
  isMarkActive,
  toggleMark,
  getMarkValue,
  setMarkValue,
  isBlockActive,
  toggleBlock,
  isAlignActive,
  toggleAlign,
  isLinkActive,
  insertLink,
} from './slateUtils';

export type { CustomEditor, CustomElement, CustomText } from './slateUtils';

export { FONT_FAMILIES, FONT_SIZES } from './constants';
export { ToolbarButton, Element, Leaf } from './SlateComponents';
export { EmailInput } from './EmailInput';
