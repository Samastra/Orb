"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronDown,
  Palette,
  Type,
  CornerDownLeft,
  Minus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
// import { Slider } from "@/components/ui/slider";

interface FormattingToolbarProps {
  selectedShape: any;
  onChange: (updates: Record<string, any>) => void;
}

const fonts = [
  { label: "Arial", value: "Arial" },
  { label: "Canva Sans", value: "Canva Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Inter", value: "Inter" },
  { label: "Open Sans", value: "Open Sans" },
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
const strokeWidths = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const borderRadiusValues = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32];

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  selectedShape,
  onChange,
}) => {
  const [formats, setFormats] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedShape) return;
    
    const activeFormats: string[] = [];
    if (selectedShape.fontWeight === "bold" || selectedShape.fontWeight === "700") 
      activeFormats.push("bold");
    if (selectedShape.fontStyle === "italic") 
      activeFormats.push("italic");
    if (selectedShape.textDecoration === "underline") 
      activeFormats.push("underline");
    
    setFormats(activeFormats);
  }, [selectedShape]);

  if (!selectedShape) return null;
  
  const isText = selectedShape.type === "text";
  const isShape = ["rect", "circle", "ellipse", "triangle", "arrow"].includes(selectedShape.type);
  const hasStroke = isShape || selectedShape.type === "stage";
  const hasCorners = ["rect", "stage"].includes(selectedShape.type);
  
  const currentFontSize = selectedShape.fontSize || 16;
  const currentFontFamily = selectedShape.fontFamily || "Canva Sans";
  const currentColor = selectedShape.fill || "#000000";
  const currentAlign = selectedShape.align || "left";
  const currentStroke = selectedShape.stroke || "#000000";
  const currentStrokeWidth = selectedShape.strokeWidth || 0;
  const currentCornerRadius = selectedShape.cornerRadius || 0;

  const handleFormatChange = (values: string[]) => {
    setFormats(values);
    const updates: Record<string, any> = {};
    
    if (values.includes("bold") !== formats.includes("bold")) {
      updates.fontWeight = values.includes("bold") ? "bold" : "normal";
    }
    if (values.includes("italic") !== formats.includes("italic")) {
      updates.fontStyle = values.includes("italic") ? "italic" : "normal";
    }
    if (values.includes("underline") !== formats.includes("underline")) {
      updates.textDecoration = values.includes("underline") ? "underline" : "none";
    }
    
    if (Object.keys(updates).length > 0) {
      onChange(updates);
    }
  };

  const handleFontSizeChange = (size: number) => {
    onChange({ fontSize: size });
  };

  const handleAlignmentChange = (align: string) => {
    onChange({ align });
  };

  const handleColorChange = (color: string) => {
    onChange({ fill: color });
  };

  const handleStrokeColorChange = (color: string) => {
    onChange({ stroke: color });
  };

  const handleStrokeWidthChange = (width: number) => {
    onChange({ strokeWidth: width });
  };

  const handleCornerRadiusChange = (radius: number) => {
    onChange({ cornerRadius: radius });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    onChange({ fontFamily });
  };

  return (
    <TooltipProvider>
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-lg border rounded-xl px-4 py-2 min-h-[52px]">
        {/* Font Family */}
        {isText && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[140px] justify-start">
                    <Type className="h-4 w-4" />
                    <span className="truncate">{currentFontFamily}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Font Family</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-48 max-h-[300px] overflow-y-auto">
              {fonts.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onSelect={() => handleFontFamilyChange(font.value)}
                  className="flex items-center gap-2"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isText && <Separator orientation="vertical" className="h-6" />}

        {/* Font Size */}
        {isText && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[60px]">
                    {currentFontSize}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Font Size</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-24 max-h-[300px] overflow-y-auto">
              {fontSizes.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onSelect={() => handleFontSizeChange(size)}
                  className="flex justify-center"
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isText && <Separator orientation="vertical" className="h-6" />}

        {/* Text Formatting */}
        {isText && (
          <ToggleGroup
            type="multiple"
            value={formats}
            onValueChange={handleFormatChange}
            className="flex gap-0 rounded-lg border bg-background p-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="bold" aria-label="Bold" className="h-8 w-8 p-0">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="italic" aria-label="Italic" className="h-8 w-8 p-0">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="underline" aria-label="Underline" className="h-8 w-8 p-0">
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        )}

        {isText && <Separator orientation="vertical" className="h-6" />}

        {/* Text Alignment */}
        {isText && (
          <ToggleGroup
            type="single"
            value={currentAlign}
            onValueChange={handleAlignmentChange}
            className="flex gap-0 rounded-lg border bg-background p-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="left" aria-label="Align Left" className="h-8 w-8 p-0">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="center" aria-label="Align Center" className="h-8 w-8 p-0">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="right" aria-label="Align Right" className="h-8 w-8 p-0">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Fill Color Picker */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-8 p-0 border-none cursor-pointer absolute opacity-0"
              />
              <div className="w-10 h-8 rounded-md border flex items-center justify-center cursor-pointer bg-background hover:bg-accent">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: currentColor }}
                />
                <Palette className="h-3 w-3 absolute bottom-1 right-1 text-muted-foreground" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Fill Color</TooltipContent>
        </Tooltip>

        {/* Stroke/Border Controls */}
        {hasStroke && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            {/* Stroke Color */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="color"
                    value={currentStroke}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-10 h-8 p-0 border-none cursor-pointer absolute opacity-0"
                  />
                  <div className="w-10 h-8 rounded-md border flex items-center justify-center cursor-pointer bg-background hover:bg-accent">
                    <div 
                      className="w-4 h-4 rounded border-2"
                      style={{ 
                        borderColor: currentStroke,
                        backgroundColor: 'transparent'
                      }}
                    />
                    <Minus className="h-3 w-3 absolute bottom-1 right-1 text-muted-foreground" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Border Color</TooltipContent>
            </Tooltip>

            {/* Stroke Width */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[50px]">
                      {currentStrokeWidth}px
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Border Width</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-20">
                {strokeWidths.map((width) => (
                  <DropdownMenuItem
                    key={width}
                    onSelect={() => handleStrokeWidthChange(width)}
                    className="flex justify-center"
                  >
                    {width}px
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Rounded Corners */}
        {hasCorners && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[50px]">
                      <CornerDownLeft className="h-4 w-4" />
                      {currentCornerRadius}px
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Corner Radius</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-20">
                {borderRadiusValues.map((radius) => (
                  <DropdownMenuItem
                    key={radius}
                    onSelect={() => handleCornerRadiusChange(radius)}
                    className="flex justify-center"
                  >
                    {radius}px
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Custom Font Size Input */}
        {isText && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentFontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-16 h-8 text-center"
                min="1"
                max="144"
              />
              <span className="text-sm text-muted-foreground">px</span>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FormattingToolbar;