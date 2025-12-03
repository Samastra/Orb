"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AdvancedTextControls from "./AdvancedTextControls"; 
import { cn } from "@/lib/utils";

import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronDown,
  Type,
  CornerDownLeft,
  Underline,
  ArrowUpWideNarrow,
  Italic,
  StickyNote,
  Settings,
  Layers,
  ChevronUp,
  Palette,
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
import ColorPicker from "./ColorPicker"; 

const Divider = () => (
  <div className="w-[1px] h-6 bg-gray-200 mx-1" />
);

interface FormatBtnProps {
  onClick?: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  label: string;
  children?: React.ReactNode; 
  className?: string;
}

const FormatBtn = React.forwardRef<HTMLButtonElement, FormatBtnProps>(
  ({ onClick, isActive, icon: Icon, label, children, className, ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            "h-8 px-2 hover:bg-gray-100/80 transition-all duration-200 rounded-lg gap-2 text-gray-600",
            isActive && "bg-blue-50 text-blue-600 hover:bg-blue-100",
            className
          )}
          {...props}
        >
          <Icon className={cn("h-4 w-4", isActive ? "stroke-[2.5px]" : "stroke-2")} />
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white border-0 text-xs">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
);
FormatBtn.displayName = "FormatBtn";

const fonts = [
  { label: "Arial", value: "Arial" },
  { label: "Canva Sans", value: "Canva Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Inter", value: "Inter" },
  { label: "Open Sans", value: "Open Sans" },
];

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

const FONT_STYLES = [
  { value: "normal", label: "Regular" },
  { value: "italic", label: "Italic" },
  { value: "oblique", label: "Oblique" }
];

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
const borderRadiusValues = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80];

interface FormattingToolbarProps {
  selectedShape: {
    type?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    fill?: string;
    textColor?: string;
    backgroundColor?: string;
    align?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
    textDecoration?: string;
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
  // NEW PROP: Dynamic Position
  position: { x: number, y: number } | null;
  onChange: (updates: Record<string, unknown>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  selectedShape,
  position,
  onChange,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formats, setFormats] = useState<string[]>([]);
  
  useEffect(() => {
    if (!selectedShape) return;
    const activeFormats: string[] = [];
    if (selectedShape.textDecoration === "underline") activeFormats.push("underline");
    setFormats(activeFormats);
  }, [selectedShape]);

  if (!selectedShape || !position || selectedShape.type === "stage") return null;

  const isText = selectedShape.type === "text";
  const isImage = selectedShape.type === "image";
  const isStickyNote = selectedShape.type === "stickyNote";
  const isShape = ["rect", "circle", "ellipse", "triangle", "arrow"].includes(selectedShape.type || "");
  const hasStroke = isShape || selectedShape.type === "stage";
  const hasCorners = ["rect", "stage"].includes(selectedShape.type || "");

  if (!isText && !isStickyNote && !isShape && !isImage) return null;

  const currentFontSize = selectedShape.fontSize || (isStickyNote ? 16 : 20);
  const currentFontFamily = selectedShape.fontFamily || "Arial";
  const currentFillColor = selectedShape.fill || "#000000";
  const currentTextColor = isStickyNote ? (selectedShape.textColor || "#000000") : (selectedShape.fill || "#000000");
  const currentBackgroundColor = isStickyNote ? (selectedShape.backgroundColor || "#ffeb3b") : "#000000";
  const currentAlign = selectedShape.align || "left";
  const currentStroke = selectedShape.stroke || "#000000";
  const currentStrokeWidth = selectedShape.strokeWidth || 0;
  const currentCornerRadius = selectedShape.cornerRadius || 0;

  const handleFormatChange = (vals: string[]) => {
    setFormats(vals);
    onChange({ textDecoration: vals.includes("underline") ? "underline" : "none" });
  };

  // Safe clamping logic to keep toolbar on screen
  // (Assuming toolbar width ~350px and height ~50px)
  let safeX = position.x;
  let safeY = position.y;

  // Simple adjustment: if it's too close to edges
  if (typeof window !== "undefined") {
     if (safeX < 180) safeX = 180; // keep left edge on screen
     if (safeX > window.innerWidth - 180) safeX = window.innerWidth - 180;
     
     if (safeY < 60) safeY = position.y + 80; // Flip to bottom if too close to top
  }

  return (
    <TooltipProvider>
      <div 
        style={{ 
          left: safeX,
          top: safeY,
          transform: 'translate(-50%, -100%)', // Centered horizontally, anchored to top of shape
          marginTop: '-12px',
          touchAction: 'none'
        }}
        className="fixed z-50 flex flex-col items-center gap-2 will-change-transform"
      >
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5 rounded-2xl px-3 py-2 transition-all duration-300">
          
          {isStickyNote && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FormatBtn icon={StickyNote} label="Note Color">
                    <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: currentBackgroundColor }} />
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </FormatBtn>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  {STICKY_NOTE_COLORS.map((color) => (
                    <DropdownMenuItem
                      key={color.value}
                      onSelect={() => onChange({ backgroundColor: color.value })}
                      className="gap-2 cursor-pointer"
                    >
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Divider />
            </>
          )}

          {(isText || isStickyNote) && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FormatBtn icon={Type} label="Font Family" className="w-24 justify-between">
                    <span className="truncate text-xs">{currentFontFamily}</span>
                  </FormatBtn>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  {fonts.map((f) => (
                    <DropdownMenuItem key={f.value} onSelect={() => onChange({ fontFamily: f.value })} style={{ fontFamily: f.value }}>
                      {f.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Divider />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FormatBtn icon={ArrowUpWideNarrow} label="Weight">
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </FormatBtn>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  {FONT_WEIGHTS.map((w) => (
                    <DropdownMenuItem key={w.value} onSelect={() => onChange({ fontWeight: w.value })} style={{ fontWeight: w.value, fontFamily: currentFontFamily }}>
                      {w.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FormatBtn icon={Italic} label="Style">
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </FormatBtn>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  {FONT_STYLES.map((s) => (
                    <DropdownMenuItem key={s.value} onSelect={() => onChange({ fontStyle: s.value })} style={{ fontStyle: s.value, fontFamily: currentFontFamily }}>
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Divider />

              <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-1 border border-transparent hover:border-gray-200 transition-colors">
                 <button onClick={() => onChange({ fontSize: Math.max(1, currentFontSize - 1) })} className="p-1 hover:bg-white rounded-md text-gray-500">
                    <Minus className="w-3 h-3" />
                 </button>
                 <Input 
                   type="number" 
                   value={currentFontSize}
                   onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                   className="w-8 h-6 text-xs text-center p-0 border-0 bg-transparent focus-visible:ring-0"
                 />
                 <button onClick={() => onChange({ fontSize: currentFontSize + 1 })} className="p-1 hover:bg-white rounded-md text-gray-500">
                    <ChevronUp className="w-3 h-3" />
                 </button>
              </div>

              <Divider />

              <ToggleGroup type="single" value={currentAlign} onValueChange={(v) => v && onChange({ align: v })} className="gap-0.5">
                 <ToggleGroupItem value="left" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"><AlignLeft className="w-4 h-4" /></ToggleGroupItem>
                 <ToggleGroupItem value="center" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"><AlignCenter className="w-4 h-4" /></ToggleGroupItem>
                 <ToggleGroupItem value="right" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"><AlignRight className="w-4 h-4" /></ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup type="multiple" value={formats} onValueChange={handleFormatChange} className="gap-0.5 ml-1">
                 <ToggleGroupItem value="underline" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"><Underline className="w-4 h-4" /></ToggleGroupItem>
              </ToggleGroup>
            </>
          )}

          <Divider />
          <div className="flex items-center gap-2">
            {isShape && (
              <ColorPicker value={currentFillColor} onChange={(c: any) => onChange({ fill: c })} label="Fill" />
            )}
            
            {(isText || isStickyNote) && (
               <ColorPicker 
                 value={currentTextColor} 
                 onChange={(c: any) => isStickyNote ? onChange({ textColor: c }) : onChange({ fill: c })} 
                 label="Text Color" 
               />
            )}
          </div>

          {hasStroke && (
            <>
              <Divider />
              <div className="flex items-center gap-1">
                <ColorPicker value={currentStroke} onChange={(c: any) => onChange({ stroke: c })} label="Border" className="border-2 border-white ring-1 ring-gray-200" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="sm" className="h-7 px-1 gap-1 text-gray-500 text-xs">
                        {currentStrokeWidth}px
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[3rem]">
                     {strokeWidths.map(w => (
                       <DropdownMenuItem key={w} onSelect={() => onChange({ strokeWidth: w })}>{w}px</DropdownMenuItem>
                     ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {hasCorners && (
            <>
               <Divider />
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                     <FormatBtn icon={CornerDownLeft} label="Radius" className="w-auto px-1">
                        <span className="text-xs ml-1">{currentCornerRadius}</span>
                     </FormatBtn>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="min-w-[3rem]">
                     {borderRadiusValues.map(r => (
                       <DropdownMenuItem key={r} onSelect={() => onChange({ cornerRadius: r })}>{r}px</DropdownMenuItem>
                     ))}
                 </DropdownMenuContent>
               </DropdownMenu>
            </>
          )}

          {isText && (
             <>
               <Divider />
               <FormatBtn 
                  icon={Settings} 
                  label={showAdvanced ? "Hide Advanced" : "Show Advanced"} 
                  isActive={showAdvanced}
                  onClick={() => setShowAdvanced(!showAdvanced)} 
               />
             </>
          )}

          {(isText || isStickyNote || isShape || isImage) && selectedShape.type !== "stage" && (
            <>
              <Divider />
              <div className="flex items-center gap-0.5">
                 <FormatBtn icon={Layers} label="To Back" onClick={onSendToBack} className="h-7 w-7 p-0 rotate-90" />
                 <FormatBtn icon={ChevronDown} label="Backward" onClick={onSendBackward} className="h-7 w-7 p-0" />
                 <FormatBtn icon={ChevronUp} label="Forward" onClick={onBringForward} className="h-7 w-7 p-0" />
                 <FormatBtn icon={Layers} label="To Front" onClick={onBringToFront} className="h-7 w-7 p-0 -rotate-90" />
              </div>
            </>
          )}
        </div>

        {showAdvanced && isText && (
          <div className="w-full bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
            <AdvancedTextControls
              selectedShape={selectedShape}
              onChange={onChange}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FormattingToolbar;