import { useCallback } from "react";
import Konva from "konva";
import { Action, ReactShape, ImageShape } from "../types/board-types";
import { KonvaShape } from "./useShapes";
import { Connection } from "./useBoardState";

export const useUndoRedo = (
  stageRef: React.RefObject<Konva.Stage | null>,
  actions: Action[],
  undoneActions: Action[],
  reactShapes: ReactShape[],
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>,
  shapes: KonvaShape[],
  stageFrames: KonvaShape[],
  images: ImageShape[],
  connections: Connection[],
  setActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setUndoneActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setReactShapes: React.Dispatch<React.SetStateAction<ReactShape[]>>,
  setLines: React.Dispatch<React.SetStateAction<Array<{tool: 'brush' | 'eraser', points: number[]}>>>,
  setShapes: React.Dispatch<React.SetStateAction<KonvaShape[]>>,
  setStageFrames: React.Dispatch<React.SetStateAction<KonvaShape[]>>,
  setImages: React.Dispatch<React.SetStateAction<ImageShape[]>>,
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>
) => {

  // --- HELPER: APPLY ACTION ---
  // This executes a single action on the state. 
  // We use this for both Undo (reverting) and Redo (applying).
  const dispatchBoardAction = useCallback((action: Action, mode: 'undo' | 'redo') => {
    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    
    // For Undo: We want to restore 'prevData'. For Redo: We want 'newData'.
    // Note: 'add' and 'delete' logic is flipped between undo/redo.
    
    switch (action.type) {
      // --- BATCH ACTIONS (Figma-style grouping) ---
      case "batch":
        // For Undo: Reverse the array so we undo the last sub-action first
        const subActions = mode === 'undo' ? [...action.actions].reverse() : action.actions;
        subActions.forEach(subAction => dispatchBoardAction(subAction, mode));
        break;

      // --- CREATION ACTIONS ---
      case "add-react-shape":
      case "add-konva-shape":
      case "add-image":
      case "add-stage-frame":
      case "add-connection":
        {
          const isAdd = mode === 'redo';
          const item = action.data;
          
          const setterMap: Record<string, any> = {
            'add-react-shape': setReactShapes,
            'add-konva-shape': setShapes,
            'add-image': setImages,
            'add-stage-frame': setStageFrames,
            'add-connection': setConnections
          };
          const setter = setterMap[action.type];
          
          if (isAdd) {
            setter((prev: any[]) => [...prev, item]);
          } else {
            setter((prev: any[]) => prev.filter((s: any) => s.id !== item.id));
          }
        }
        break;

      case "add-line":
        if (mode === 'redo') {
           setLines(prev => [...prev, action.line]);
        } else {
           setLines(prev => prev.slice(0, -1)); // Remove last
        }
        break;

      // --- DELETION ACTIONS ---
      case "delete-react-shape":
      case "delete-konva-shape":
      case "delete-image":
      case "delete-stage-frame":
      case "delete-connection":
        {
          const isDelete = mode === 'redo';
          const item = action.data; // The deleted item data
          
          const setterMap: Record<string, any> = {
            'delete-react-shape': setReactShapes,
            'delete-konva-shape': setShapes,
            'delete-image': setImages,
            'delete-stage-frame': setStageFrames,
            'delete-connection': setConnections
          };
          const setter = setterMap[action.type];

          if (isDelete) {
            // Actually delete
            setter((prev: any[]) => prev.filter((s: any) => s.id !== item.id));
          } else {
            // Restore (Undo delete)
            setter((prev: any[]) => [...prev, item]);
          }
        }
        break;
        
      case "delete-line":
        if (mode === 'redo') {
           setLines(prev => prev.filter((_, i) => i !== action.lineIndex));
        } else {
           // Restore line at specific index
           setLines(prev => {
             const newLines = [...prev];
             newLines.splice(action.lineIndex, 0, action.data);
             return newLines;
           });
        }
        break;

      // --- UPDATE ACTIONS (Move, Resize, Text Change) ---
      case "update-react-shape":
      case "update-konva-shape":
      case "update-image":
      case "update-stage-frame":
      case "update-connection":
        {
          const dataToApply = mode === 'undo' ? action.prevData : action.newData;
          const targetId = action.id;

          const setterMap: Record<string, any> = {
            'update-react-shape': setReactShapes,
            'update-konva-shape': setShapes,
            'update-image': setImages,
            'update-stage-frame': setStageFrames,
            'update-connection': setConnections
          };
          const setter = setterMap[action.type];

          setter((prev: any[]) => prev.map((item: any) => 
            item.id === targetId ? { ...item, ...dataToApply } : item
          ));
        }
        break;
    }
  }, [setReactShapes, setShapes, setImages, setStageFrames, setConnections, setLines, stageRef]);


  // --- PUBLIC API ---

  const addAction = useCallback((action: Action) => {
    console.log('💾 Saving action:', action.type);
    setActions(prev => {
       // Optional: Cap history size to 50
       const newHistory = [...prev, action];
       if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
       return newHistory;
    });
    setUndoneActions([]); // Clear redo stack on new action
  }, [setActions, setUndoneActions]);

  const undo = useCallback(() => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    
    console.log('↩️ Undoing:', lastAction.type);
    dispatchBoardAction(lastAction, 'undo');

    setActions(prev => prev.slice(0, -1));
    setUndoneActions(prev => [...prev, lastAction]);
  }, [actions, dispatchBoardAction, setActions, setUndoneActions]);

  const redo = useCallback(() => {
    if (undoneActions.length === 0) return;
    const nextAction = undoneActions[undoneActions.length - 1];
    
    console.log('↪️ Redoing:', nextAction.type);
    dispatchBoardAction(nextAction, 'redo');

    setUndoneActions(prev => prev.slice(0, -1));
    setActions(prev => [...prev, nextAction]);
  }, [undoneActions, dispatchBoardAction, setActions, setUndoneActions]);

  return {
    addAction,
    undo,
    redo,
  };
};