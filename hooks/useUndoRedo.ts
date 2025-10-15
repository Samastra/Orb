import { useCallback } from "react";
import Konva from "konva";
import { Action, ReactShape, ImageShape } from "../types/board-types";
import { KonvaShape } from "./useShapes";
import { Connection } from "./useBoardState"; // ADD THIS IMPORT

export const useUndoRedo = (
  stageRef: React.RefObject<Konva.Stage | null>,
  actions: Action[],
  undoneActions: Action[],
  reactShapes: ReactShape[],
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>,
  shapes: KonvaShape[],
  stageFrames: KonvaShape[],
  images: ImageShape[],
  connections: Connection[], // ADD THIS - connection state
  setActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setUndoneActions: React.Dispatch<React.SetStateAction<Action[]>>,
  setReactShapes: React.Dispatch<React.SetStateAction<ReactShape[]>>,
  setLines: React.Dispatch<React.SetStateAction<Array<{tool: 'brush' | 'eraser', points: number[]}>>>,
  setShapes: React.Dispatch<React.SetStateAction<KonvaShape[]>>,
  setStageFrames: React.Dispatch<React.SetStateAction<KonvaShape[]>>,
  setImages: React.Dispatch<React.SetStateAction<ImageShape[]>>,
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>> // ADD THIS
) => {
  const addAction = useCallback((action: Action) => {
    console.log('💾 Saving action:', action.type, action);
    setActions(prev => [...prev, action]);
    setUndoneActions([]);
  }, [setActions, setUndoneActions]);

  const undo = useCallback(() => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    console.log('↩️ Undoing:', lastAction.type, lastAction);
    
    setActions(prev => prev.slice(0, -1));
    setUndoneActions(prev => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    
    switch (lastAction.type) {
      case "add":
        if (drawLayer) {
          const target = drawLayer.findOne(`#${lastAction.node.id()}`);
          if (target) {
            target.destroy();
            drawLayer.batchDraw();
          }
        }
        break;
        
      case "add-react-shape":
        setReactShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
        
      case "add-konva-shape":
        setShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;

      case "add-stage-frame":
        setStageFrames(prev => prev.filter(frame => frame.id !== lastAction.data.id));
        break;

      case "add-image":
        setImages(prev => prev.filter(image => image.id !== lastAction.data.id));
        break;

      case "add-connection":
        setConnections(prev => prev.filter(conn => conn.id !== lastAction.data.id));
        break;
        
      case "add-line":
        setLines(prev => prev.slice(0, -1));
        break;
        
      case "update":
        if (drawLayer) {
          const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
          if (updateTarget) {
            updateTarget.setAttrs(lastAction.prevAttrs);
            drawLayer.batchDraw();
          }
        }
        break;
        
      case "update-react-shape":
        setReactShapes(prev => prev.map(shape => 
          shape.id === lastAction.id ? lastAction.prevData : shape
        ));
        break;
        
      case "update-konva-shape":
        setShapes(prev => prev.map(shape => 
          shape.id === lastAction.id ? lastAction.prevData : shape
        ));
        break;

      case "update-connection":
        setConnections(prev => prev.map(conn => 
          conn.id === lastAction.id ? lastAction.prevData : conn
        ));
        break;

      case "delete-stage-frame":
        setStageFrames(prev => [...prev, lastAction.data]);
        break;

      case "delete-image":
        setImages(prev => [...prev, lastAction.data]);
        break;

      case "delete-connection":
        // For delete-connection, we need to find the connection by ID and restore it
        const connectionToRestore = connections.find(conn => conn.id === lastAction.connectionId);
        if (connectionToRestore) {
          setConnections(prev => [...prev, connectionToRestore]);
        }
        break;
        
      case "delete":
        if (drawLayer) {
          drawLayer.add(lastAction.node);
          drawLayer.batchDraw();
        }
        break;
        
      case "delete-react-shape":
        setReactShapes(prev => [...prev, lastAction.data]);
        break;
        
      case "delete-konva-shape":
        setShapes(prev => [...prev, lastAction.data]);
        break;
        
      case "delete-line":
        setLines(prev => {
          const newLines = [...prev];
          newLines.splice(lastAction.lineIndex, 0, lines[lastAction.lineIndex]);
          return newLines;
        });
        break;
    }
  }, [actions, stageRef, setActions, setUndoneActions, setReactShapes, setLines, setShapes, setStageFrames, setImages, setConnections, connections, lines]);

  const redo = useCallback(() => {
    if (undoneActions.length === 0) return;
    const lastAction = undoneActions[undoneActions.length - 1];
    console.log('↪️ Redoing:', lastAction.type, lastAction);
    
    setUndoneActions(prev => prev.slice(0, -1));
    setActions(prev => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;

    switch (lastAction.type) {
      case "add":
        if (drawLayer) {
          drawLayer.add(lastAction.node);
          drawLayer.batchDraw();
        }
        break;
        
      case "add-react-shape":
        setReactShapes(prev => [...prev, lastAction.data]);
        break;
      
      case "add-konva-shape":
        setShapes(prev => [...prev, lastAction.data]);
        break;

      case "add-stage-frame":
        setStageFrames(prev => [...prev, lastAction.data]);
        break;

      case "add-image":
        setImages(prev => [...prev, lastAction.data]);
        break;

      case "add-connection":
        setConnections(prev => [...prev, lastAction.data]);
        break;
        
      case "add-line":
        setLines(prev => [...prev, lastAction.line]);
        break;
        
      case "update":
        if (drawLayer) {
          const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
          if (updateTarget) {
            updateTarget.setAttrs(lastAction.newAttrs);
            drawLayer.batchDraw();
          }
        }
        break;
        
      case "update-react-shape":
        setReactShapes(prev => prev.map(shape => 
          shape.id === lastAction.id ? lastAction.newData : shape
        ));
        break;
        
      case "update-konva-shape":
        setShapes(prev => prev.map(shape => 
          shape.id === lastAction.id ? lastAction.newData : shape
        ));
        break;

      case "update-connection":
        setConnections(prev => prev.map(conn => 
          conn.id === lastAction.id ? lastAction.newData : conn
        ));
        break;

      case "delete-stage-frame":
        setStageFrames(prev => prev.filter(frame => frame.id !== lastAction.data.id));
        break;

      case "delete-image":
        setImages(prev => prev.filter(image => image.id !== lastAction.data.id));
        break;

      case "delete-connection":
        // For delete-connection, remove the connection by ID
        setConnections(prev => prev.filter(conn => conn.id !== lastAction.connectionId));
        break;
        
      case "delete":
        if (drawLayer) {
          const deleteTarget = drawLayer.findOne(`#${lastAction.node.id()}`);
          if (deleteTarget) {
            deleteTarget.destroy();
            drawLayer.batchDraw();
          }
        }
        break;
        
      case "delete-react-shape":
        setReactShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
        
      case "delete-konva-shape":
        setShapes(prev => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
      
      case "delete-line":
        setLines(prev => prev.filter((_, index) => index !== lastAction.lineIndex));
        break;
    }
  }, [undoneActions, stageRef, setActions, setUndoneActions, setReactShapes, setLines, setShapes, setStageFrames, setImages, setConnections]);

  return {
    addAction,
    undo,
    redo,
  };
};