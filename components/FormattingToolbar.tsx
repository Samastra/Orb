"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Settings } from "lucide-react";
import AdvancedTextControls from "./AdvancedTextControls";

import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronDown,
  Palette,
  Type,
  CornerDownLeft,
  Minus,
  Underline,
  ArrowUpWideNarrow,
  Italic,
  StickyNote
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
import ColorPicker from "./ColorPicker";
import { ChevronUp,Layers } from "lucide-react";

interface FormattingToolbarProps {
  selectedShape: any;
  onChange: (updates: Record<string, any>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

// Font data - simplified without hardcoded weights
const fonts = [
  { label: "Arial", value: "Arial" },
  { label: "Canva Sans", value: "Canva Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Inter", value: "Inter" },
  { label: "Open Sans", value: "Open Sans" },
];

// Common font weights - browser will handle fallbacks
const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra Light" },
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" }
];

// Font styles
const FONT_STYLES = [
  { value: "normal", label: "Regular" },
  { value: "italic", label: "Italic" },
  { value: "oblique", label: "Oblique" }
];

// Sticky note colors
const STICKY_NOTE_COLORS = [
  { value: "#ffeb3b", label: "Yellow" },
  { value: "#e3f2fd", label: "Blue" },
  { value: "#e8f5e8", label: "Green" },
  { value: "#fce4ec", label: "Pink" },
  { value: "#fff3e0", label: "Orange" },
  { value: "#f3e5f5", label: "Purple" },
  { value: "#e0f2f1", label: "Teal" },
  { value: "#fafafa", label: "White" }
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
const strokeWidths = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const borderRadiusValues = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32];

const getKonvaFontWeight = (weight: string): string => {
  const weightMap: { [key: string]: string } = {
    "normal": "400",
    "bold": "700",
    "lighter": "300", 
    "bolder": "800",
    "100": "100",
    "200": "200",
    "300": "300",
    "400": "400",
    "500": "500",
    "600": "600",
    "700": "700",
    "800": "800",
    "900": "900"
  };
  return weightMap[weight] || "400";
};

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  selectedShape,
  onChange,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formats, setFormats] = useState<string[]>([]);

  const handleBringForward = () => {
    console.log('🎯 Bring Forward button clicked');
    console.log('🎯 Selected shape:', selectedShape);
    onBringForward();
  };

  const handleSendBackward = () => {
    console.log('🎯 Send Backward button clicked');
    console.log('🎯 Selected shape:', selectedShape);
    onSendBackward();
  };

  const handleBringToFront = () => {
    console.log('🎯 Bring to Front button clicked');
    console.log('🎯 Selected shape:', selectedShape);
    onBringToFront();
  };

  const handleSendToBack = () => {
    console.log('🎯 Send to Back button clicked');
    console.log('🎯 Selected shape:', selectedShape);
    onSendToBack();
  };

  useEffect(() => {
    if (!selectedShape) return;
    
    const activeFormats: string[] = [];
    if (selectedShape.textDecoration === "underline") 
      activeFormats.push("underline");
    
    setFormats(activeFormats);
  }, [selectedShape]);

  if (!selectedShape) return null;
  
  const isText = selectedShape.type === "text";
  const isStickyNote = selectedShape.type === "stickyNote";
  const isShape = ["rect", "circle", "ellipse", "triangle", "arrow"].includes(selectedShape.type);
  const hasStroke = isShape || selectedShape.type === "stage";
  const hasCorners = ["rect", "stage"].includes(selectedShape.type);
  
  // FIXED: Proper color handling for different shape types
  const currentFontSize = selectedShape.fontSize || (isStickyNote ? 16 : 20);
  const currentFontFamily = selectedShape.fontFamily || "Arial";
  const currentFontWeight = selectedShape.fontWeight || "400";
  const currentFontStyle = selectedShape.fontStyle || "normal";
  const currentFillColor = selectedShape.fill || "#000000"; // For shapes and text
  const currentTextColor = isStickyNote ? (selectedShape.textColor || "#000000") : (selectedShape.fill || "#000000"); // For text in sticky notes
  const currentBackgroundColor = isStickyNote ? (selectedShape.backgroundColor || "#ffeb3b") : "#000000";
  const currentAlign = selectedShape.align || "left";
  const currentStroke = selectedShape.stroke || "#000000";
  const currentStrokeWidth = selectedShape.strokeWidth || 0;
  const currentCornerRadius = selectedShape.cornerRadius || 0;

  // Get display label for current weight
  const getWeightLabel = (weight: string) => {
    const weightObj = FONT_WEIGHTS.find(w => w.value === weight);
    return weightObj ? weightObj.label : "Regular";
  };

  // Get display label for current style
  const getStyleLabel = (style: string) => {
    const styleObj = FONT_STYLES.find(s => s.value === style);
    return styleObj ? styleObj.label : "Regular";
  };

  // Get display label for sticky note color
  const getStickyNoteColorLabel = (color: string) => {
    const colorObj = STICKY_NOTE_COLORS.find(c => c.value === color);
    return colorObj ? colorObj.label : "Custom";
  };

  const handleFormatChange = (values: string[]) => {
    setFormats(values);
    
    if (values.includes("underline") !== formats.includes("underline")) {
      onChange({ 
        textDecoration: values.includes("underline") ? "underline" : "none" 
      });
    }
  };

  const handleFontSizeChange = (size: number) => {
    onChange({ fontSize: size });
  };

  const handleAlignmentChange = (align: string) => {
    onChange({ align });
  };

  // FIXED: Proper color handling
  const handleFillColorChange = (color: string) => {
    onChange({ fill: color });
  };

  const handleTextColorChange = (color: string) => {
    if (isStickyNote) {
      onChange({ textColor: color });
    } else {
      onChange({ fill: color });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    onChange({ backgroundColor: color });
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

  const handleFontWeightChange = (weight: string) => {
    const konvaWeight = getKonvaFontWeight(weight);
    onChange({ fontWeight: konvaWeight });
  };

  const handleFontStyleChange = (style: string) => {
    onChange({ fontStyle: style });
  };

  return (
    <TooltipProvider>
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-lg border rounded-xl px-4 py-2 min-h-[52px]">
        {/* Sticky Note Color Picker */}
        {isStickyNote && (
          <>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[120px] justify-start">
                      <StickyNote className="h-4 w-4" style={{ color: currentBackgroundColor }} />
                      <span className="truncate">{getStickyNoteColorLabel(currentBackgroundColor)}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Note Color</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-48">
                {STICKY_NOTE_COLORS.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onSelect={() => handleBackgroundColorChange(color.value)}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Font Family */}
        {(isText || isStickyNote) && (
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

        {(isText || isStickyNote) && <Separator orientation="vertical" className="h-6" />}

        {/* Font Weight */}
        {(isText || isStickyNote) && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[100px] justify-start">
                    <ArrowUpWideNarrow className="h-4 w-4" />
                    <span className="truncate">{getWeightLabel(currentFontWeight)}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Font Weight</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-32">
              {FONT_WEIGHTS.map((weight) => (
                <DropdownMenuItem
                  key={weight.value}
                  onSelect={() => handleFontWeightChange(weight.value)}
                  className="flex justify-between"
                  style={{ 
                    fontWeight: weight.value,
                    fontFamily: currentFontFamily 
                  }}
                >
                  {weight.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(isText || isStickyNote) && <Separator orientation="vertical" className="h-6" />}

        {/* Font Style */}
        {(isText || isStickyNote) && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[80px] justify-start">
                    <Italic className="h-4 w-4" />
                    <span className="truncate">{getStyleLabel(currentFontStyle)}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Font Style</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-28">
              {FONT_STYLES.map((style) => (
                <DropdownMenuItem
                  key={style.value}
                  onSelect={() => handleFontStyleChange(style.value)}
                  className="flex justify-between"
                  style={{ 
                    fontStyle: style.value,
                    fontFamily: currentFontFamily 
                  }}
                >
                  {style.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(isText || isStickyNote) && <Separator orientation="vertical" className="h-6" />}

        {/* Font Size */}
        {(isText || isStickyNote) && (
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

        {(isText || isStickyNote) && <Separator orientation="vertical" className="h-6" />}

        {/* Underline Toggle */}
        {(isText || isStickyNote) && (
          <ToggleGroup
            type="single"
            value={formats.includes("underline") ? "underline" : ""}
            onValueChange={(value) => handleFormatChange(value ? ["underline"] : [])}
            className="flex gap-0 rounded-lg border bg-background p-1"
          >
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

        {(isText || isStickyNote) && <Separator orientation="vertical" className="h-6" />}

        {/* Text Alignment */}
        {(isText || isStickyNote) && (
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

        {/* FILL COLOR PICKER - For Shapes */}
        {isShape && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ColorPicker
                  value={currentFillColor}
                  onChange={handleFillColorChange}
                  label="Fill Color"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Fill Color</TooltipContent>
          </Tooltip>
        )}

        {/* TEXT COLOR PICKER - For Text and Sticky Notes */}
        {(isText || isStickyNote) && (
          <>
            {isShape && <Separator orientation="vertical" className="h-6" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ColorPicker
                    value={currentTextColor}
                    onChange={handleTextColorChange}
                    label="Text Color"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Text Color</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Background Color Picker for Sticky Notes */}
        {isStickyNote && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ColorPicker
                    value={currentBackgroundColor}
                    onChange={handleBackgroundColorChange}
                    label="Note Color"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Note Background</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Stroke/Border Controls */}
        {hasStroke && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            {/* Stroke Color */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ColorPicker
                    value={currentStroke}
                    onChange={handleStrokeColorChange}
                    label="Border Color"
                    className="border-dashed"
                  />
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
        {(isText || isStickyNote) && (
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

        {/* Settings Button */}
        {isText && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAdvanced ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Layer Controls */}
        {(isText || isStickyNote || isShape) && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            {/* Layer Controls Group */}
            <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSendToBack}
                    className="h-8 w-8 p-0"
                  >
                    <Layers className="h-4 w-4 rotate-90" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send to Back</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSendBackward}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Backward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBringForward}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bring Forward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBringToFront}
                    className="h-8 w-8 p-0"
                  >
                    <Layers className="h-4 w-4 -rotate-90" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bring to Front</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* Advanced Controls Panel */}
      {showAdvanced && isText && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-lg border rounded-xl px-4 py-2 min-h-[52px]">
          <AdvancedTextControls
            selectedShape={selectedShape}
            onChange={onChange}
          />
        </div>
      )}
    </TooltipProvider>
  );
};

export default FormattingToolbar;