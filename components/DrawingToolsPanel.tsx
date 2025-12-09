import React from "react";
import {
    Pen,
    Minus,
    MoveRight,
    Square,
    Circle,
    Triangle,
    Diamond,
    Spline
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tool } from "../types/board-types";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DrawingToolsPanelProps {
    onSelect: (tool: Tool, mode?: "brush" | "eraser") => void;
    activeTool: Tool | null;
    drawingMode: "brush" | "eraser";
    orientation: 'vertical' | 'horizontal';
}

const ToolBtn = ({ onClick, isActive, icon: Icon, label }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                    isActive
                        ? "bg-blue-100 text-blue-600 shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
            >
                <Icon className="w-5 h-5 stroke-2" />
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs bg-gray-900 text-white border-0">
            {label}
        </TooltipContent>
    </Tooltip>
);

const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
    onSelect,
    activeTool,
    drawingMode,
    orientation
}) => {
    return (
        <div className={cn(
            "absolute flex items-center gap-1 p-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200",
            orientation === 'vertical'
                ? "left-full ml-3 top-0 flex-col py-2" // Vertical Layout: Side panel
                : "top-full mt-3 left-0 flex-row px-2"  // Horizontal Layout: Bottom panel
        )}>

            {/* 1. Freehand */}
            <ToolBtn
                label="Freehand"
                icon={Pen}
                isActive={activeTool === 'pen' && drawingMode === 'brush'}
                onClick={() => onSelect('pen', 'brush')}
            />

            {/* 2. Connectors */}
            <div className={orientation === 'vertical' ? "w-6 h-[1px] bg-gray-100 my-1" : "h-6 w-[1px] bg-gray-100 mx-1"} />

            <ToolBtn
                label="Straight Line"
                icon={Minus}
                isActive={activeTool === 'line'} // Need to add 'line' to Tool type
                onClick={() => onSelect('line' as Tool)}
            />

            <ToolBtn
                label="Arrow"
                icon={MoveRight}
                isActive={activeTool === 'arrow'}
                onClick={() => onSelect('arrow')}
            />

            <ToolBtn
                label="Curved Connector"
                icon={Spline} // Lucide Spline looks like a curve
                isActive={activeTool === 'connect'}
                onClick={() => onSelect('connect')}
            />

            {/* 3. Shapes */}
            <div className={orientation === 'vertical' ? "w-6 h-[1px] bg-gray-100 my-1" : "h-6 w-[1px] bg-gray-100 mx-1"} />

            <ToolBtn
                label="Rectangle"
                icon={Square}
                isActive={activeTool === 'rect'}
                onClick={() => onSelect('rect')}
            />

            <ToolBtn
                label="Rounded Rectangle"
                icon={Square} // Using Square icon for now, could be a custom icon later
                isActive={activeTool === 'rounded_rect'}
                onClick={() => onSelect('rounded_rect' as Tool)}
            />

            <ToolBtn
                label="Circle"
                icon={Circle}
                isActive={activeTool === 'circle'}
                onClick={() => onSelect('circle')}
            />

            <ToolBtn
                label="Triangle"
                icon={Triangle}
                isActive={activeTool === 'triangle'}
                onClick={() => onSelect('triangle')}
            />

            <ToolBtn
                label="Diamond"
                icon={Diamond}
                isActive={activeTool === 'rhombus'} // Need to add 'rhombus'/diamond to Tool
                onClick={() => onSelect('rhombus' as Tool)}
            />

        </div>
    );
};

export default DrawingToolsPanel;
