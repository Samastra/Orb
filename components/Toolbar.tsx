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
    <div className="absolute left-0 top-20 flex flex-col items-center">
      {/* Main Tools */}
      <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-md">
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleToolChange("select")}
              className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
                activeTool === "select" ? "bg-blue-300" : "hover:bg-gray-300"
              }`}
            >
              <img src={toolIcons["select"]} alt="select" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Move Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("text")}
              className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
            >
              <img src={toolIcons["text"]} alt="text" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Text Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Sticky Note */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => addShape("stickyNote")}
              className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
            >
              <img src={toolIcons["stickyNote"]} alt="sticky-note" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Sticky Note</p>
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
              className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
                activeTool === "pen" && drawingMode === "brush" ? "bg-blue-300" : "hover:bg-gray-300"
              }`}
            >
              <img src="/image/edit-pen.svg" alt="pen" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Pen Tool</p>
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
              className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
                activeTool === "pen" && drawingMode === "eraser" ? "bg-blue-300" : "hover:bg-gray-300"
              }`}
            >
              <img src="/image/eraser.svg" alt="eraser" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Eraser Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Stage Tool */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300">
                  <img src={toolIcons["stage"]} alt="stage" className="w-6 h-6" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add Stage</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">Dimensions</h4>
                <p className="text-muted-foreground text-sm">
                  Input stage size
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width :px</Label>
                  <Input
                    id="width"
                    className="col-span-2 h-8"
                    value={tempDimensions.width}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      width: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height :px</Label>
                  <Input
                    id="height"
                    className="col-span-2 h-8"
                    value={tempDimensions.height}
                    onChange={(e) => setTempDimensions(prev => ({
                      ...prev,
                      height: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleApplyStage}>
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
              className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
                activeTool === "connect" ? "bg-blue-300" : "hover:bg-gray-300"
              }`}
            >
              <img src={toolIcons["connect"]} alt="connect" className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Connection Tool</p>
          </TooltipContent>
        </Tooltip>

        {/* Shapes Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="my-1 w-10 h-10 rounded hover:bg-gray-300 flex items-center justify-center cursor-pointer">
                  <img src={toolIcons["shapes"]} alt="shapes" className="w-6 h-6" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Shapes</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <div className="absolute left-12">
            <DropdownMenuContent side="right" align="start">
              {shapeOptions.map((shape) => (
                <DropdownMenuItem 
                  key={shape.value} 
                  onClick={() => addShape(shape.value as Tool)}
                >
                  <img src={shape.icon} alt={shape.label} className="w-5 h-5" />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </div>
        </DropdownMenu>
      </div>

      {/* Undo/Redo Buttons */}
      <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-md">
        <button
          onClick={undo}
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300"
        >
          <img src="/image/undo.svg" alt="undo" />
        </button>
        <button
          onClick={redo}
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300"
        >
          <img src="/image/redo.svg" alt="redo" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;