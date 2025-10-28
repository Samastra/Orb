// components/AdvancedTextControls.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import {
  ChevronDown,
  CaseSensitive,
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Sparkles,
  Type
} from "lucide-react";
import ColorPicker from "./ColorPicker";

  interface AdvancedTextControlsProps {
  selectedShape: {
    type?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textTransform?: string;
    textShadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
  } | null;
  onChange: (updates: Record<string, unknown>) => void;
}


// Define proper TypeScript types
type TextTransformValue = "none" | "uppercase" | "lowercase" | "capitalize";

interface TextTransformOption {
  value: TextTransformValue;
  label: string;
}

// Text transform options with proper typing
const TEXT_TRANSFORMS: TextTransformOption[] = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "capitalize", label: "Capitalize" }
];

const AdvancedTextControls: React.FC<AdvancedTextControlsProps> = ({
  selectedShape,
  onChange,
}) => {
  if (!selectedShape || selectedShape.type !== "text") return null;

  // Get current values with defaults
  const currentLetterSpacing = selectedShape.letterSpacing || 0;
  const currentLineHeight = selectedShape.lineHeight || 1.2;
  const currentTextTransform = selectedShape.textTransform || "none";
  const currentTextShadow = selectedShape.textShadow || {
    color: "#000000",
    blur: 0,
    offsetX: 0,
    offsetY: 0
  };

  const handleLetterSpacingChange = (value: number[]) => {
    onChange({ letterSpacing: value[0] });
  };

  const handleLineHeightChange = (value: number[]) => {
    onChange({ lineHeight: value[0] });
  };

  const handleTextTransformChange = (transform: TextTransformValue) => {
    onChange({ textTransform: transform });
  };

  const handleTextShadowChange = (updates: Partial<typeof currentTextShadow>) => {
    onChange({
      textShadow: { ...currentTextShadow, ...updates }
    });
  };

  const getTransformLabel = (transform: string) => {
    const transformObj = TEXT_TRANSFORMS.find(t => t.value === transform);
    return transformObj ? transformObj.label : "None";
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Letter Spacing */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 min-w-[120px]">
              <BetweenHorizontalStart className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="letter-spacing" className="text-xs text-muted-foreground">
                  Tracking
                </Label>
                <Slider
                  id="letter-spacing"
                  value={[currentLetterSpacing]}
                  onValueChange={handleLetterSpacingChange}
                  max={20}
                  min={-5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-xs w-8 text-right">
                {currentLetterSpacing}px
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Letter Spacing (Tracking)</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border" />

        {/* Line Height */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 min-w-[120px]">
              <BetweenVerticalStart className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="line-height" className="text-xs text-muted-foreground">
                  Leading
                </Label>
                <Slider
                  id="line-height"
                  value={[currentLineHeight]}
                  onValueChange={handleLineHeightChange}
                  max={3}
                  min={0.8}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-xs w-8 text-right">
                {currentLineHeight}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Line Height (Leading)</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border" />

        {/* Text Transform */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 font-medium min-w-[100px] justify-start">
                  <CaseSensitive className="h-4 w-4" />
                  <span className="truncate">{getTransformLabel(currentTextTransform)}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Text Transform</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-32">
            {TEXT_TRANSFORMS.map((transform) => (
              <DropdownMenuItem
                key={transform.value}
                onSelect={() => handleTextTransformChange(transform.value)}
                className="flex justify-between"
                style={{ 
                  textTransform: transform.value === "none" ? "none" : transform.value 
                }}
              >
                {transform.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        {/* Text Shadow Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentTextShadow.blur > 0 ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => {
                if (currentTextShadow.blur > 0) {
                  handleTextShadowChange({ blur: 0, offsetX: 0, offsetY: 0 });
                } else {
                  handleTextShadowChange({ blur: 5, offsetX: 2, offsetY: 2 });
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {currentTextShadow.blur > 0 ? "Remove Shadow" : "Add Shadow"}
          </TooltipContent>
        </Tooltip>

        {/* Shadow Controls (when shadow is active) */}
        {currentTextShadow.blur > 0 && (
          <>
            <ColorPicker
              value={currentTextShadow.color}
              onChange={(color) => handleTextShadowChange({ color })}
              label="Shadow Color"
              className="w-8 h-8"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 min-w-[80px]">
                  <div className="flex-1">
                    <Slider
                      value={[currentTextShadow.blur]}
                      onValueChange={(value) => handleTextShadowChange({ blur: value[0] })}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-xs w-6 text-right">
                    {currentTextShadow.blur}px
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Shadow Blur</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AdvancedTextControls;