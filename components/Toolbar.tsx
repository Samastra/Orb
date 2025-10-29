import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
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
  compact?: boolean;
  onImageUpload?: (file: File) => void;
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
  compact = false,
  onImageUpload,
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    event.target.value = '';
  };

  return (
    <div className={cn(
      "fixed md:absolute left-4 top-24 md:top-24 flex flex-col items-center z-30 transition-all duration-300",
      compact ? "scale-90 origin-left" : ""
    )}>
      {/* Premium Glass Morphism Toolbar */}
      <div className="flex flex-row md:flex-col items-center space-y-0 md:space-y-3 bg-white/95 backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-xl border border-gray-200/80 hover:shadow-2xl transition-all duration-300">
        
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleToolChange("select")}
              className={cn(
                "flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all duration-300 border-2",
                activeTool === "select" 
                  ? "bg-blue-50 border-blue-500 shadow-md scale-105" 
                  : "hover:bg-gray-100/80 border-transparent hover:border-gray-300 hover:scale-105"
              )}
            >
              <img src={toolIcons["select"]} alt="select" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Move Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("text")}
              className="flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl hover:bg-gray-100/80 transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:scale-105"
            >
              <img src={toolIcons["text"]} alt="text" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Text Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Sticky Note */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("stickyNote")}
              className="flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl hover:bg-gray-100/80 transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:scale-105"
            >
              <img src={toolIcons["stickyNote"]} alt="sticky-note" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Sticky Note</p>
          </TooltipContent>
        </Tooltip>

        {/* Image Upload */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload image"
              />
              <button className="flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl hover:bg-gray-100/80 transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:scale-105">
                <img src="/image/image-icon.png" alt="upload" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Upload Image</p>
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
              className={cn(
                "flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all duration-300 border-2",
                activeTool === "pen" && drawingMode === "brush" 
                  ? "bg-blue-50 border-blue-500 shadow-md scale-105" 
                  : "hover:bg-gray-100/80 border-transparent hover:border-gray-300 hover:scale-105"
              )}
            >
              <img src="/image/edit-pen.svg" alt="pen" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Pen Tool</p>
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
              className={cn(
                "flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all duration-300 border-2",
                activeTool === "pen" && drawingMode === "eraser" 
                  ? "bg-blue-50 border-blue-500 shadow-md scale-105" 
                  : "hover:bg-gray-100/80 border-transparent hover:border-gray-300 hover:scale-105"
              )}
            >
              <img src="/image/eraser.svg" alt="eraser" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Eraser Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Stage Tool */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl hover:bg-gray-100/80 transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:scale-105">
                  <img src={toolIcons["stage"]} alt="stage" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
              <p className="text-xs font-medium">Add Stage</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right" sideOffset={15} className="w-80 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-xl">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Stage Dimensions</h4>
                <p className="text-sm text-gray-600">
                  Set the size for your stage frame
                </p>
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="width" className="text-sm font-medium text-gray-700">Width (px)</Label>
                  <Input
                    id="width"
                    className="col-span-2 h-9 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={tempDimensions.width}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      width: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="height" className="text-sm font-medium text-gray-700">Height (px)</Label>
                  <Input
                    id="height"
                    className="col-span-2 h-9 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={tempDimensions.height}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      height: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button 
                    onClick={handleApplyStage} 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Create Stage
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
              className={cn(
                "flex items-center justify-center my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all duration-300 border-2",
                activeTool === "connect" 
                  ? "bg-blue-50 border-blue-500 shadow-md scale-105" 
                  : "hover:bg-gray-100/80 border-transparent hover:border-gray-300 hover:scale-105"
              )}
            >
              <img src={toolIcons["connect"]} alt="connect" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
            <p className="text-xs font-medium">Connection Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Shapes Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="my-1 w-10 h-10 md:w-12 md:h-12 rounded-xl hover:bg-gray-100/80 flex items-center justify-center cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:scale-105">
                  <img src={toolIcons["shapes"]} alt="shapes" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="bg-gray-900 text-white border-0">
                <p className="text-xs font-medium">Shapes</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-xl p-2 min-w-14">
            <div className="grid grid-cols-2 gap-2">
              {shapeOptions.map((shape) => (
                <DropdownMenuItem 
                  key={shape.value} 
                  onClick={() => addShape(shape.value as Tool)}
                  className="flex items-center justify-center p-2 cursor-pointer rounded-lg hover:bg-gray-100/80 transition-all duration-200"
                >
                  <img src={shape.icon} alt={shape.label} className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Toolbar;