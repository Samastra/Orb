import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
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
import { Tool } from "../types/board-types";
import { toolIcons, shapeOptions } from "../constants/tool-constants";

interface ToolbarProps {
  activeTool: Tool | null;
  drawingMode: 'brush' | 'eraser';
  tempDimensions: { width: number; height: number };
  handleToolChange: (tool: Tool | null) => void;
  setDrawingMode: (mode: 'brush' | 'eraser') => void;
  addShape: (type: Tool) => void;
  setTempDimensions: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  handleApplyStage: () => void;
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
  undo,
  redo,
}) => {
  return (
    <div className="fixed md:absolute left-0 top-20 md:top-20 flex flex-col items-center z-50">
      {/* Main Tools */}
      <div className="flex flex-row md:flex-col items-center space-y-0 md:space-y-4 space-x-2 md:space-x-0 bg-white p-2 md:p-3 m-2 md:m-5 rounded-md shadow-md border border-gray-200">
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleToolChange("select")}
              className={`flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded transition-colors ${
                activeTool === "select" 
                  ? "bg-blue-300 border-2 border-blue-500" 
                  : "hover:bg-gray-300 border-2 border-transparent"
              }`}
            >
              <img src={toolIcons["select"]} alt="select" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Move Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("text")}
              className="flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 transition-colors border-2 border-transparent"
            >
              <img src={toolIcons["text"]} alt="text" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Text Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Sticky Note */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("stickyNote")}
              className="flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 transition-colors border-2 border-transparent"
            >
              <img src={toolIcons["stickyNote"]} alt="sticky-note" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Sticky Note</p>
          </TooltipContent>
        </Tooltip>

        {/* Pen Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                handleToolChange("pen");
                setDrawingMode("brush");
              }}
              className={`flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded transition-colors border-2 ${
                activeTool === "pen" && drawingMode === "brush" 
                  ? "bg-blue-300 border-blue-500" 
                  : "hover:bg-gray-300 border-transparent"
              }`}
            >
              <img src="/image/edit-pen.svg" alt="pen" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Pen Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Eraser Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                handleToolChange("pen");
                setDrawingMode("eraser");
              }}
              className={`flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded transition-colors border-2 ${
                activeTool === "pen" && drawingMode === "eraser" 
                  ? "bg-blue-300 border-blue-500" 
                  : "hover:bg-gray-300 border-transparent"
              }`}
            >
              <img src="/image/eraser.svg" alt="eraser" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Eraser Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Stage Tool */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 transition-colors border-2 border-transparent">
                  <img src={toolIcons["stage"]} alt="stage" className="w-4 h-4 md:w-6 md:h-6" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              <p className="text-xs md:text-sm">Add Stage</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right" sideOffset={10} className="w-80 md:w-96">
            <div className="grid gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <h4 className="leading-none font-medium text-sm md:text-base">Dimensions</h4>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Input stage size
                </p>
              </div>
              <div className="grid gap-2 md:gap-3">
                <div className="grid grid-cols-3 items-center gap-2 md:gap-4">
                  <Label htmlFor="width" className="text-xs md:text-sm">Width :px</Label>
                  <Input
                    id="width"
                    className="col-span-2 h-7 md:h-8 text-xs md:text-sm"
                    value={tempDimensions.width}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      width: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2 md:gap-4">
                  <Label htmlFor="height" className="text-xs md:text-sm">Height :px</Label>
                  <Input
                    id="height"
                    className="col-span-2 h-7 md:h-8 text-xs md:text-sm"
                    value={tempDimensions.height}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      height: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="mt-2 md:mt-4 flex justify-end">
                  <Button onClick={handleApplyStage} size="sm" className="text-xs md:text-sm">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Connection Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleToolChange("connect")}
              className={`flex items-center justify-center my-1 w-8 h-8 md:w-10 md:h-10 rounded transition-colors border-2 ${
                activeTool === "connect" 
                  ? "bg-blue-300 border-blue-500" 
                  : "hover:bg-gray-300 border-transparent"
              }`}
            >
              <img src={toolIcons["connect"]} alt="connect" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Connection Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Shapes Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="my-1 w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 flex items-center justify-center cursor-pointer transition-colors border-2 border-transparent">
                  <img src={toolIcons["shapes"]} alt="shapes" className="w-4 h-4 md:w-6 md:h-6" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                <p className="text-xs md:text-sm">Shapes</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-12">
            <div className="grid grid-cols-2 gap-1 p-1">
              {shapeOptions.map((shape) => (
                <DropdownMenuItem 
                  key={shape.value} 
                  onClick={() => addShape(shape.value as Tool)}
                  className="flex items-center justify-center p-2 cursor-pointer"
                >
                  <img src={shape.icon} alt={shape.label} className="w-4 h-4 md:w-5 md:h-5" />
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Undo/Redo Buttons */}
      <div className="flex flex-row md:flex-col items-center space-y-0 md:space-y-4 space-x-2 md:space-x-0 bg-white p-2 md:p-3 m-2 md:m-5 rounded-md shadow-md border border-gray-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={undo}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 transition-colors"
            >
              <img src="/image/undo.svg" alt="undo" className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={redo}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded hover:bg-gray-300 transition-colors"
            >
              <img src="/image/redo.svg" alt="redo" className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            <p className="text-xs md:text-sm">Redo</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default Toolbar;