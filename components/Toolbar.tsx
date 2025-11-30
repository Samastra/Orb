import React from "react";
import {
  MousePointer2,
  Type,
  StickyNote,
  Image as ImageIcon,
  Pen,
  Eraser,
  TvMinimal, // Icon for Stage
  Cable, // Perfect icon for "Connection"
  Shapes,
  Upload
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

// --- HELPER COMPONENTS ---

// A simple divider to separate tool groups
const Divider = () => (
  <div className="w-full h-[1px] bg-gray-200 my-1 md:w-8 md:h-[1px] md:my-2" />
);

// A reusable button component to keep code clean
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
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105" // Active State
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900" // Inactive State
        )}
      >
        <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
        
        {/* Subtle dot indicator for active state (optional, adds polish) */}
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
  compact = false,
  onImageUpload,
}) => {
  const handleImageUploadWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    event.target.value = '';
  };

  return (
    <div className={cn(
      "fixed md:absolute left-4 top-24 md:top-1/2 md:-translate-y-1/2 z-30 transition-all duration-300",
      compact ? "scale-90 origin-left" : ""
    )}>
      <div className="flex flex-col items-center p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5">
        
        {/* --- GROUP 1: POINTERS --- */}
        <div className="flex flex-col gap-2">
          <ToolbarBtn 
            label="Move Tool (V)" 
            icon={MousePointer2} 
            isActive={activeTool === "select"} 
            onClick={() => handleToolChange("select")} 
          />
          
          <ToolbarBtn 
            label="Connection Tool (C)" 
            icon={Cable} 
            isActive={activeTool === "connect"} 
            onClick={() => handleToolChange("connect")} 
          />
        </div>

        <Divider />

        {/* --- GROUP 2: CREATION --- */}
        <div className="flex flex-col gap-2">
          <ToolbarBtn 
            label="Text" 
            icon={Type} 
            isActive={false} // Text tool usually resets after click, usually doesn't stay 'active' like a brush
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

        <Divider />

        {/* --- GROUP 3: DRAWING --- */}
        <div className="flex flex-col gap-2">
          <ToolbarBtn 
            label="Pen" 
            icon={Pen} 
            isActive={activeTool === "pen" && drawingMode === "brush"} 
            onClick={() => { handleToolChange("pen"); setDrawingMode("brush"); }} 
          />
          
          <ToolbarBtn 
            label="Eraser" 
            icon={Eraser} 
            isActive={activeTool === "pen" && drawingMode === "eraser"} 
            onClick={() => { handleToolChange("pen"); setDrawingMode("eraser"); }} 
          />
        </div>

        <Divider />

        {/* --- GROUP 4: ADVANCED --- */}
        <div className="flex flex-col gap-2">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                    <TvMinimal className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={15} className="bg-gray-900 text-white border-0 font-medium">
                Add Frame
              </TooltipContent>
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
                      <Input
                        id="width"
                        className="h-8 text-sm rounded-md border-gray-200 focus:border-blue-500 pr-8"
                        value={tempDimensions.width}
                        onChange={(e) => setTempDimensions(prev => ({...prev, width: parseInt(e.target.value) || 0}))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="height" className="text-xs font-medium text-gray-500">Height</Label>
                    <div className="col-span-2 relative">
                      <Input
                        id="height"
                        className="h-8 text-sm rounded-md border-gray-200 focus:border-blue-500 pr-8"
                        value={tempDimensions.height}
                        onChange={(e) => setTempDimensions(prev => ({...prev, height: parseInt(e.target.value) || 0}))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleApplyStage} 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                  >
                    Create Frame
                  </Button>
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