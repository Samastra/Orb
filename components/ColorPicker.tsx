// components/ColorPicker.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, RefreshCw } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

// Common color swatches
const COLOR_SWATCHES = [
  "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF",
  "#5856D6", "#FF2D55", "#AF52DE", "#FF3B30", "#FF9500", "#FFCC00",
  "#4CD964", "#5AC8FA", "#007AFF", "#5856D6", "#FF2D55", "#AF52DE"
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = "Color",
  className = ""
}) => {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hexInput, setHexInput] = useState(value);

  // Update hex input when value changes
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  // Load recent colors from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recent-colors");
    if (saved) {
      setRecentColors(JSON.parse(saved));
    }
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    
    // Add to recent colors (avoid duplicates)
    setRecentColors(prev => {
      const newRecent = [color, ...prev.filter(c => c !== color)].slice(0, 8);
      localStorage.setItem("recent-colors", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      handleColorSelect(hexInput.toUpperCase());
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Auto-add # if missing
    if (input && !input.startsWith("#")) {
      input = "#" + input;
    }
    
    setHexInput(input);
    
    // Update color in real-time if valid
    if (/^#[0-9A-F]{6}$/i.test(input)) {
      onChange(input.toUpperCase());
    }
  };

  const clearRecentColors = () => {
    setRecentColors([]);
    localStorage.removeItem("recent-colors");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-10 h-8 p-0 border rounded-md relative ${className}`}
        >
          <div 
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: value }}
          />
          <Palette className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground bg-background rounded-full border" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          {/* Current Color Preview */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: value }}
              />
              <span className="text-sm font-mono">{value}</span>
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">COLOR SWATCHES</h4>
            <div className="grid grid-cols-8 gap-1">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">RECENT COLORS</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={clearRecentColors}
                  title="Clear recent colors"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hex Input */}
          <form onSubmit={handleHexSubmit} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">CUSTOM COLOR</h4>
            <div className="flex gap-2">
              <Input
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#000000"
                className="h-8 text-sm font-mono"
                maxLength={7}
              />
              <Button type="submit" size="sm" className="h-8">
                Apply
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;