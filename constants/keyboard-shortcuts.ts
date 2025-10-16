// constants/keyboard-shortcuts.ts

// Detect user's operating system
export const isMac = typeof window !== 'undefined' 
  ? /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  : false;

// Platform-specific modifier key display
export const MODIFIER_KEY = isMac ? '⌘' : 'Ctrl';

// Shortcut categories for organization
export type ShortcutCategory = 
  | 'navigation' 
  | 'editing' 
  | 'tools' 
  | 'view' 
  | 'selection';

// Shortcut definition interface
export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: ShortcutCategory;
  action: () => void;
  context?: 'always' | 'when-selected' | 'when-not-editing';
}

// Format keys for display (platform-aware)
export const formatKeys = (keys: string[]): string => {
  return keys.map(key => {
    switch (key.toLowerCase()) {
      case 'ctrl':
        return isMac ? '⌘' : 'Ctrl';
      case 'cmd':
        return '⌘';
      case 'shift':
        return '⇧';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'escape':
        return 'Esc';
      case 'backspace':
        return '⌫';
      case 'delete':
        return 'Del';
      case 'enter':
        return '↵';
      case 'space':
        return 'Space';
      case 'arrowup':
        return '↑';
      case 'arrowdown':
        return '↓';
      case 'arrowleft':
        return '←';
      case 'arrowright':
        return '→';
      case 'plus':
        return '+';
      case 'minus':
        return '-';
      default:
        return key.toUpperCase();
    }
  }).join(' + ');
};

// Get platform-aware modifier key name
const getModifierKeyName = (): string => isMac ? 'meta' : 'ctrl';

// PHASE 1: FOUNDATION SHORTCUTS
export const PHASE_1_SHORTCUTS = {
  // Selection & Editing
  DELETE: {
    keys: ['delete'],
    description: 'Delete selected shape',
    category: 'editing' as ShortcutCategory,
  },
  BACKSPACE: {
    keys: ['backspace'],
    description: 'Delete selected shape',
    category: 'editing' as ShortcutCategory,
  },
  ESCAPE: {
    keys: ['escape'],
    description: 'Deselect all',
    category: 'selection' as ShortcutCategory,
  },

  // Tools
  SELECT_TOOL: {
    keys: ['v'],
    description: 'Select tool',
    category: 'tools' as ShortcutCategory,
  },
  TEXT_TOOL: {
    keys: ['t'],
    description: 'Text tool',
    category: 'tools' as ShortcutCategory,
  },
  PEN_TOOL: {
    keys: ['p'],
    description: 'Pen tool',
    category: 'tools' as ShortcutCategory,
  },
  CONNECTION_TOOL: {
    keys: ['c'],
    description: 'Connection tool',
    category: 'tools' as ShortcutCategory,
  },
  STICKY_NOTE_TOOL: {
    keys: ['n'],
    description: 'Sticky note tool',
    category: 'tools' as ShortcutCategory,
  },

  // Undo/Redo - USE PLATFORM-SPECIFIC MODIFIER
  UNDO: {
    keys: [getModifierKeyName(), 'z'],
    description: 'Undo last action',
    category: 'editing' as ShortcutCategory,
  },
  REDO: {
    keys: [getModifierKeyName(), 'y'],
    description: 'Redo last action',
    category: 'editing' as ShortcutCategory,
  },

  // Zoom - USE ACTUAL KEY NAMES
  ZOOM_IN: {
    keys: [getModifierKeyName(), '='],
    description: 'Zoom in',
    category: 'view' as ShortcutCategory,
  },
  ZOOM_OUT: {
    keys: [getModifierKeyName(), '-'],
    description: 'Zoom out',
    category: 'view' as ShortcutCategory,
  },
};

// All shortcuts for easy iteration
export const ALL_SHORTCUTS = {
  ...PHASE_1_SHORTCUTS,
};

// Tool shortcuts mapping for quick access
export const TOOL_SHORTCUTS = {
  'select': PHASE_1_SHORTCUTS.SELECT_TOOL,
  'text': PHASE_1_SHORTCUTS.TEXT_TOOL,
  'pen': PHASE_1_SHORTCUTS.PEN_TOOL,
  'connect': PHASE_1_SHORTCUTS.CONNECTION_TOOL,
  'stickyNote': PHASE_1_SHORTCUTS.STICKY_NOTE_TOOL,
};

// Get display label for a tool
export const getToolShortcutLabel = (tool: string): string => {
  const shortcut = TOOL_SHORTCUTS[tool as keyof typeof TOOL_SHORTCUTS];
  return shortcut ? formatKeys(shortcut.keys) : '';
};

// Helper to check if two key arrays match (order-independent)
export const keysMatch = (keys1: string[], keys2: string[]): boolean => {
  if (keys1.length !== keys2.length) return false;
  
  const sorted1 = [...keys1].sort();
  const sorted2 = [...keys2].sort();
  
  return sorted1.every((key, index) => 
    key.toLowerCase() === sorted2[index]?.toLowerCase()
  );
};

// NEW: Check if modifier key is pressed based on platform
export const isModifierPressed = (event: KeyboardEvent): boolean => {
  return isMac ? event.metaKey : event.ctrlKey;
};

// NEW: Get the actual modifier key name for the current platform
export const getCurrentModifierKey = (): string => isMac ? 'meta' : 'ctrl';