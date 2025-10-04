import { useCallback } from "react";
import Konva from "konva";
import { Action, ReactShape } from "../types/board-types";

export const useUndoRedo = (
  stageRef: React.RefObject<Konva.Stage | null>,
  actions: Action[],
  undoneActions: Action[],
  reactShapes: ReactShape[],
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>,
  setActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setUndoneActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setReactShapes: React.Dispatch<React.SetStateAction<ReactShape[]>>,
  setLines: React.Dispatch<React.SetStateAction<Array<{tool: 'brush' | 'eraser', points: number[]}>>>
) => {
  const addAction = useCallback((action: Action) => {
    setActions(prev => [...prev, action]);
    setUndoneActions([]);
  }, [setActions, setUndoneActions]);

  const undo = useCallback(() => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions(prev => prev.slice(0, -1));
    setUndoneActions(prev => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    switch (lastAction.type) {
      case "add":
        const target = drawLayer.findOne(`#${lastAction.node.id()}`);
        if (target) {
          target.destroy();
          drawLayer.batchDraw();
        }
        break;
      case "add-react-shape":
        setReactShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
      case "add-line":
        setLines(prev => prev.slice(0, -1));
        break;
      case "update":
        const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
        if (updateTarget) {
          updateTarget.setAttrs(lastAction.prevAttrs);
          drawLayer.batchDraw();
        }
        break;
      case "delete":
        drawLayer.add(lastAction.node);
        drawLayer.batchDraw();
        break;
      case "delete-react-shape":
        setReactShapes(prev => [...prev, lastAction.data]);
        break;
      case "delete-line":
        if (lastAction.lineIndex !== undefined) {
          const deletedLine = undoneActions[undoneActions.length - 1] as any;
          if (lines[lastAction.lineIndex]) {
            setLines(prev => {
              const restoredLine = prev[lastAction.lineIndex];
              return [...prev, restoredLine];
            });
          }
        }
        break;
    }
  }, [actions, undoneActions, lines, stageRef, setActions, setUndoneActions, setReactShapes, setLines]);

  const redo = useCallback(() => {
    if (undoneActions.length === 0) return;
    const lastAction = undoneActions[undoneActions.length - 1];
    setUndoneActions(prev => prev.slice(0, -1));
    setActions(prev => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    switch (lastAction.type) {
      case "add":
        drawLayer.add(lastAction.node);
        drawLayer.batchDraw();
        break;
      case "add-react-shape":
        setReactShapes(prev => [...prev, lastAction.data]);
        break;
      case "add-line":
        setLines(prev => [...prev, lastAction.line]);
        break;
      case "update":
        const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
        if (updateTarget) {
          updateTarget.setAttrs(lastAction.newAttrs);
          drawLayer.batchDraw();
        }
        break;
      case "delete":
        const deleteTarget = drawLayer.findOne(`#${lastAction.node.id()}`);
        if (deleteTarget) {
          deleteTarget.destroy();
          drawLayer.batchDraw();
        }
        break;
      case "delete-react-shape":
        setReactShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
      case "delete-line":
        setLines(prev => prev.filter((_, index) => index !== lastAction.lineIndex));
        break;
    }
  }, [undoneActions, stageRef, setActions, setUndoneActions, setReactShapes, setLines]);

  return {
    addAction,
    undo,
    redo,
  };
};