import React, { useState, useEffect, useRef } from "react";
import {
  MousePointer2,
  Type,
  StickyNote,
  Image as ImageIcon,
  Pen,
  Eraser,
  TvMinimal,
  Shapes,
  GripHorizontal,
  GripVertical,
  Undo2,
  Redo2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tool } from "../types/board-types";
import { shapeOptions } from "../constants/tool-constants";
import DrawingToolsPanel from "./DrawingToolsPanel";

// --- HELPER COMPONENTS ---

// Updated Divider to handle orientation
const Divider = ({ orientation }: { orientation: 'vertical' | 'horizontal' }) => (
  <div className={cn(
    "bg-gray-200",
    orientation === 'vertical' ? "w-8 h-[1px] my-2" : "w-[1px] h-8 mx-2"
  )} />
);

interface ToolbarBtnProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ElementType;
  label: string;
}

const ToolbarBtn = ({ onClick, isActive, icon: Icon, label }: ToolbarBtnProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 md:bg-transparent" />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={15} className="bg-gray-900 text-white border-0 font-medium">
      {label}
    </TooltipContent>
  </Tooltip>
);

// --- MAIN COMPONENT ---

interface ToolbarProps {
  activeTool: Tool | null;
  drawingMode: 'brush' | 'eraser';
  tempDimensions: { width: number; height: number };
  handleToolChange: (tool: Tool | null) => void;
  setDrawingMode: (mode: 'brush' | 'eraser') => void;
  addShape: (type: Tool) => void;
  setTempDimensions: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  handleApplyStage: () => void;
  compact?: boolean;
  onImageUpload?: (file: File) => void;
  undo: () => void;
  redo: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  drawingMode,
  tempDimensions,
  handleToolChange,
  setDrawingMode,
  addShape,
  setTempDimensions,
  handleApplyStage,
  compact = false,
  onImageUpload,
  undo,
  redo
}) => {

  // --- DRAGGABLE LOGIC ---
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  // NEW: State for Orientation
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setPosition({
        x: elementStartRef.current.x + dx,
        y: elementStartRef.current.y + dy,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.PointerEvent) => {
    // Only drag on left click (button 0)
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { x: position.x, y: position.y };
    document.body.style.cursor = 'grabbing';
  };

  const handleImageUploadWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    event.target.value = '';
  };

  // NEW: Toggle function
  const toggleOrientation = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default context menu
    setOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  };

  // NEW: State for Drawing Panel
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);

  // Handle Tool Select from Panel
  const handlePanelSelect = (tool: Tool, mode?: 'brush' | 'eraser') => {
    handleToolChange(tool);
    if (mode) setDrawingMode(mode);
    // Keep panel open? Or close? User said "from the opened toolbar choose...", usually sticky.
    // We'll keep it open or let user close it by clicking Pen again.
  };

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none'
      }}
      className={cn(
        "fixed top-0 left-0 z-30 transition-shadow duration-300 will-change-transform",
        compact ? "scale-90 origin-left" : ""
      )}
    >
      <div className={cn(
        "flex items-center p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5",
        // Dynamic Flex Direction
        orientation === 'vertical' ? "flex-col" : "flex-row"
      )}>

        {/* --- DRAG HANDLE --- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onPointerDown={handleDragStart}
              onContextMenu={toggleOrientation} // Right click to toggle
              onDoubleClick={toggleOrientation} // Double click to toggle
              className={cn(
                "flex justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors",
                orientation === 'vertical' ? "w-full py-1 mb-1" : "h-full px-1 mr-1"
              )}
            >
              {/* Dynamic Icon */}
              {orientation === 'vertical' ? <GripHorizontal className="w-5 h-5" /> : <GripVertical className="w-5 h-5" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side={orientation === 'vertical' ? "right" : "bottom"} className="bg-gray-900 text-white border-0 text-xs">
            Drag to move • Double-click to change orientation
          </TooltipContent>
        </Tooltip>

        {/* --- GROUP 1: SELECTION --- */}
        <div className={cn("flex gap-2", orientation === 'vertical' ? "flex-col" : "flex-row")}>
          <ToolbarBtn
            label="Move Tool (V)"
            icon={MousePointer2}
            isActive={activeTool === "select"}
            onClick={() => handleToolChange("select")}
          />
        </div>

        <Divider orientation={orientation} />

        {/* --- GROUP 2: CREATION --- */}
        <div className={cn("flex gap-2", orientation === 'vertical' ? "flex-col" : "flex-row")}>
          <ToolbarBtn
            label="Text"
            icon={Type}
            isActive={false}
            onClick={() => addShape("text")}
          />

          <ToolbarBtn
            label="Sticky Note"
            icon={StickyNote}
            isActive={false}
            onClick={() => addShape("stickyNote")}
          />

          {/* Shapes Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                    <Shapes className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={15} className="bg-gray-900 text-white border-0 font-medium">
                  Shapes
                </TooltipContent>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-32 bg-white/95 backdrop-blur-xl border-gray-200 shadow-xl rounded-xl p-2 ml-4">
              <div className="grid grid-cols-2 gap-2">
                {shapeOptions.map((shape) => (
                  <DropdownMenuItem
                    key={shape.value}
                    onClick={() => addShape(shape.value as Tool)}
                    className="flex flex-col items-center justify-center p-2 cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors"
                  >
                    <img src={shape.icon} alt={shape.label} className="w-6 h-6 mb-1 opacity-70" />
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Image Upload */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploadWrapper}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Upload image"
                />
                <ImageIcon className="w-5 h-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={15} className="bg-gray-900 text-white border-0 font-medium">
              Upload Image
            </TooltipContent>
          </Tooltip>
        </div>

        <Divider orientation={orientation} />

        {/* --- GROUP 3: DRAWING (ADVANCED PEN) --- */}
        <div className="relative">
          <ToolbarBtn
            label="Drawing Tools"
            icon={Pen} // Use Pen icon as the "Menu" trigger
            isActive={['pen', 'line', 'arrow', 'rect', 'circle', 'triangle', 'rhombus', 'connect'].includes(activeTool || '')}
            onClick={() => setShowDrawingPanel(!showDrawingPanel)}
          />

          {showDrawingPanel && (
            <DrawingToolsPanel
              onSelect={handlePanelSelect}
              activeTool={activeTool}
              drawingMode={drawingMode}
              orientation={orientation}
            />
          )}
        </div>

        <Divider orientation={orientation} />

        {/* --- GROUP 4: ADVANCED / HISTORY --- */}
        <div className={cn("flex gap-2", orientation === 'vertical' ? "flex-col" : "flex-row")}>
          {/* Undo */}
          <ToolbarBtn label="Undo (Ctrl+Z)" icon={Undo2} isActive={false} onClick={undo} />
          {/* Redo */}
          <ToolbarBtn label="Redo (Ctrl+Y)" icon={Redo2} isActive={false} onClick={redo} />

          <Divider orientation={orientation} />

          {/* Stage Frame */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                    <TvMinimal className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={15} className="bg-gray-900 text-white border-0 font-medium">Add Frame</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" align="start" sideOffset={20} className="w-72 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-gray-900">Stage Frame</h4>
                  <p className="text-xs text-gray-500">Create a container for your content</p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="width" className="text-xs font-medium text-gray-500">Width</Label>
                    <div className="col-span-2 relative">
                      <Input id="width" className="h-8 text-sm rounded-md border-gray-200 focus:border-blue-500 pr-8" value={tempDimensions.width} onChange={(e) => setTempDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="height" className="text-xs font-medium text-gray-500">Height</Label>
                    <div className="col-span-2 relative">
                      <Input id="height" className="h-8 text-sm rounded-md border-gray-200 focus:border-blue-500 pr-8" value={tempDimensions.height} onChange={(e) => setTempDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <Button onClick={handleApplyStage} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">Create Frame</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;