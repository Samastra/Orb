// hooks/useKeyboardShortcuts.ts
import { useCallback, useEffect, useRef } from 'react';
import { Tool } from '@/types/board-types';
import { 
  ALL_SHORTCUTS, 
  PHASE_1_SHORTCUTS, 
  keysMatch, 
  MODIFIER_KEY,
  formatKeys,
  KeyboardShortcut,
  isModifierPressed,
  getCurrentModifierKey
} from '@/constants/keyboard-shortcuts';

interface UseKeyboardShortcutsProps {
  selectedNodeIds: string[]; // CHANGED: From selectedNodeId to selectedNodeIds
  deleteShape: (id: string) => void;
  setSelectedNodeIds: (ids: string[] | ((prev: string[]) => string[])) => void; // CHANGED: Updated setter
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  handleToolChange: (tool: Tool | null) => void;
  addShape: (type: Tool) => void;
  undo: () => void;
  redo: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  isEditingText?: boolean;
}

export const useKeyboardShortcuts = (props: UseKeyboardShortcutsProps) => {
  const pressedKeys = useRef<Set<string>>(new Set());
  const isSpacePanning = useRef(false);
  const modifierKey = getCurrentModifierKey();
  
  // Use refs to store the latest props to avoid stale closures
  const propsRef = useRef(props);

  // Update refs when props change
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  // Check if we're in a context where shortcuts should be disabled
  const shouldIgnoreShortcuts = useCallback((): boolean => {
    const activeElement = document.activeElement;
    const isTextInput = activeElement?.tagName === 'INPUT' || 
                      activeElement?.tagName === 'TEXTAREA' ||
                      activeElement?.getAttribute('contenteditable') === 'true';
    
    if (isTextInput) {
      console.log('⌨️ Ignoring shortcut - text input focused');
      return true;
    }
    
    return false;
  }, [props.isEditingText]);

  // Handle key down events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (shouldIgnoreShortcuts()) return;

    const key = event.key.toLowerCase();
    const currentProps = propsRef.current;
    
    // Clear and rebuild pressed keys to avoid duplicates
    pressedKeys.current.clear();
    
    // Add the main key
    if (key !== 'control' && key !== 'meta') {
      pressedKeys.current.add(key);
    }
    
    // Add modifier key if pressed
    if (isModifierPressed(event)) {
      pressedKeys.current.add(modifierKey);
    }

    const currentKeys = Array.from(pressedKeys.current);
    
    console.log('⌨️ Key pressed:', { 
      key, 
      currentKeys, 
      ctrlKey: event.ctrlKey, 
      metaKey: event.metaKey,
      modifierPressed: isModifierPressed(event),
      selectedNodeIds: currentProps.selectedNodeIds // ADDED: Log selected nodes
    });

    // CRITICAL: Prevent default for ALL problematic browser shortcuts EARLY
    if (isModifierPressed(event)) {
      switch(key) {
        case 'z': // Undo
        case 'y': // Redo
        case '=': // Zoom in
        case '-': // Zoom out
        case 'n': // Sticky note
          console.log('🛑 Preventing browser default for:', key);
          event.preventDefault();
          event.stopPropagation();
          break;
      }
    }

    // Also prevent for non-modifier problematic keys
    switch(key) {
      case 'delete':
      case 'backspace':
        if (currentProps.selectedNodeIds.length > 0) { // CHANGED: Check if any nodes are selected
          console.log('🛑 Preventing default for delete/backspace');
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case 'escape':
        console.log('🛑 Preventing default for escape');
        event.preventDefault();
        event.stopPropagation();
        break;
    }

    // Handle shortcuts
    const shouldPreventDefault = handleShortcut(event, currentKeys, currentProps);
    if (shouldPreventDefault) {
      console.log('⌨️ Shortcut handler preventing default for:', key);
      event.preventDefault();
      event.stopPropagation();
    }
  }, [shouldIgnoreShortcuts, modifierKey]);

  // Handle key up events
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    // Remove the key that was released
    pressedKeys.current.delete(key);
    
    // Also remove modifier key if it's no longer pressed
    if ((key === 'control' || key === 'meta') && !isModifierPressed(event)) {
      pressedKeys.current.delete(modifierKey);
    }

    if (key === ' ' && isSpacePanning.current) {
      isSpacePanning.current = false;
    }
  }, [modifierKey]);

  // Main shortcut handler
  const handleShortcut = useCallback((event: KeyboardEvent, currentKeys: string[], props: any): boolean => {
    console.log('🔍 Checking shortcut for keys:', currentKeys, 'against all shortcuts...');

    // === SELECTION & EDITING ===
    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.DELETE.keys) || 
        keysMatch(currentKeys, PHASE_1_SHORTCUTS.BACKSPACE.keys)) {
      if (props.selectedNodeIds.length > 0) { // CHANGED: Check if any nodes are selected
        console.log('🗑️ Deleting selected shapes:', props.selectedNodeIds);
        // Delete all selected shapes
        props.selectedNodeIds.forEach((id: string) => {
          props.deleteShape(id);
        });
        return true;
      }
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.ESCAPE.keys)) {
      console.log('⎋ Deselecting all');
      props.setSelectedNodeIds([]); // CHANGED: Clear array instead of setting null
      return true;
    }

    // === TOOLS ===
    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.SELECT_TOOL.keys)) {
      console.log('🔧 Switching to Select Tool');
      props.handleToolChange('select');
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.TEXT_TOOL.keys)) {
      console.log('🔧 Switching to Text Tool');
      props.handleToolChange('text');
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.PEN_TOOL.keys)) {
      console.log('🔧 Switching to Pen Tool');
      props.handleToolChange('pen');
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.CONNECTION_TOOL.keys)) {
      console.log('🔧 Switching to Connection Tool');
      props.handleToolChange('connect');
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.STICKY_NOTE_TOOL.keys)) {
      console.log('🔧 Switching to Sticky Note Tool');
      props.handleToolChange('stickyNote');
      return true;
    }

    // === UNDO/REDO ===
    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.UNDO.keys)) {
      console.log('↩️ Undoing');
      props.undo();
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.REDO.keys)) {
      console.log('↪️ Redoing');
      props.redo();
      return true;
    }

    // === ZOOM ===
    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.ZOOM_IN.keys)) {
      console.log('🔍 Zooming in');
      props.handleZoomIn();
      return true;
    }

    if (keysMatch(currentKeys, PHASE_1_SHORTCUTS.ZOOM_OUT.keys)) {
      console.log('🔍 Zooming out');
      props.handleZoomOut();
      return true;
    }

    // === SPACE PANNING ===
    if (event.key === ' ' && !isSpacePanning.current) {
      isSpacePanning.current = true;
      console.log('🚀 Space panning activated');
      return true;
    }

    console.log('❌ No shortcut matched for keys:', currentKeys);
    return false;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);
    const onKeyUp = (event: KeyboardEvent) => handleKeyUp(event);

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      pressedKeys.current.clear();
    };
  }, [handleKeyDown, handleKeyUp]);

  const getActiveKeys = useCallback((): string[] => {
    return Array.from(pressedKeys.current);
  }, []);

  const isShortcutActive = useCallback((shortcutKeys: string[]): boolean => {
    return keysMatch(getActiveKeys(), shortcutKeys);
  }, [getActiveKeys]);

  return {
    isSpacePanning: isSpacePanning.current,
    activeKeys: getActiveKeys(),
    isShortcutActive,
    formatKeys,
    MODIFIER_KEY,
    shortcuts: ALL_SHORTCUTS,
  };
};

export type { KeyboardShortcut };