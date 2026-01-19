import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pipette, Hash, Palette, Check, AlertCircle } from 'lucide-react';
import { rgbToHex, hexToRgb, isValidHex, extractMostCommonColors } from '@/lib/chromaKey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorSelectorProps {
  selectedColor: { r: number; g: number; b: number };
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  isEyedropperActive: boolean;
  onEyedropperToggle: () => void;
  disabled?: boolean;
  sourceCanvas?: HTMLCanvasElement | null;
}

export function ColorSelector({
  selectedColor,
  onColorChange,
  isEyedropperActive,
  onEyedropperToggle,
  disabled = false,
  sourceCanvas,
}: ColorSelectorProps) {
  const hexValue = rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b);
  const [hexInput, setHexInput] = useState(hexValue);
  const [hexError, setHexError] = useState(false);

  // Extract most common colors from the image
  const quickColors = useMemo(() => {
    if (!sourceCanvas) {
      // Fallback to default colors when no image is loaded
      return [
        { color: { r: 0, g: 255, b: 0 }, name: 'Green' },
        { color: { r: 0, g: 177, b: 64 }, name: 'Chroma Green' },
        { color: { r: 0, g: 71, b: 187 }, name: 'Blue' },
        { color: { r: 255, g: 255, b: 255 }, name: 'White' },
        { color: { r: 0, g: 0, b: 0 }, name: 'Black' },
      ];
    }

    try {
      const colors = extractMostCommonColors(sourceCanvas, 5, 10);
      return colors.map((color, index) => ({
        color,
        name: `Color ${index + 1}`,
      }));
    } catch (error) {
      console.error('Error extracting colors:', error);
      // Fallback to default colors on error
      return [
        { color: { r: 0, g: 255, b: 0 }, name: 'Green' },
        { color: { r: 0, g: 177, b: 64 }, name: 'Chroma Green' },
        { color: { r: 0, g: 71, b: 187 }, name: 'Blue' },
        { color: { r: 255, g: 255, b: 255 }, name: 'White' },
        { color: { r: 0, g: 0, b: 0 }, name: 'Black' },
      ];
    }
  }, [sourceCanvas]);

  useEffect(() => {
    setHexInput(hexValue);
    setHexError(false);
  }, [hexValue]);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    
    const cleanValue = value.startsWith('#') ? value : `#${value}`;
    
    if (isValidHex(cleanValue)) {
      setHexError(false);
      const rgb = hexToRgb(cleanValue);
      if (rgb) onColorChange(rgb);
    } else if (value.length >= 7 || (value.length >= 6 && !value.startsWith('#'))) {
      setHexError(true);
    } else {
      setHexError(false);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) onColorChange(rgb);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <Label className="text-sm font-medium text-foreground">Chroma Key Color</Label>

      {/* Color Preview Swatch */}
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
        <motion.div
          key={hexValue}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-12 h-12 rounded-lg shadow-soft-md border border-border"
          style={{ backgroundColor: hexValue }}
        />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Selected Color</p>
          <p className="text-sm font-mono font-medium text-foreground">{hexValue.toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">
            RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
          </p>
        </div>
      </div>

      {/* Color Selection Methods */}
      <div className="space-y-3">
        {/* Eyedropper */}
        <Button
          variant={isEyedropperActive ? 'default' : 'outline'}
          size="sm"
          onClick={onEyedropperToggle}
          disabled={disabled}
          className="w-full justify-start gap-2 h-10"
        >
          <Pipette className="w-4 h-4" />
          <span className="flex-1 text-left">
            {isEyedropperActive ? 'Click on image to pick color' : 'Eyedropper'}
          </span>
          {isEyedropperActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-success rounded-full animate-pulse-soft"
            />
          )}
        </Button>

        {/* Hex Input */}
        <div className="space-y-1.5">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={hexInput.replace('#', '')}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="00FF00"
              maxLength={7}
              disabled={disabled}
              className={`pl-9 font-mono uppercase ${hexError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {hexError && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
            )}
          </div>
          {hexError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive"
            >
              Invalid hex color
            </motion.p>
          )}
        </div>

        {/* Color Picker */}
        <div className="relative">
          <label className="flex items-center gap-2 h-10 px-3 bg-secondary hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Color Picker</span>
            <input
              type="color"
              value={hexValue}
              onChange={handleColorPickerChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="ml-auto w-6 h-6 rounded border border-border"
              style={{ backgroundColor: hexValue }}
            />
          </label>
        </div>
      </div>

      {/* Common Chroma Key Colors */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-2">
          {sourceCanvas ? 'Quick Colors (from image)' : 'Quick Colors'}
        </p>
        <div className="flex gap-2 flex-wrap">
          {quickColors.map(({ color, name }, index) => {
            const hex = rgbToHex(color.r, color.g, color.b);
            const isSelected = selectedColor.r === color.r && 
                              selectedColor.g === color.g && 
                              selectedColor.b === color.b;
            return (
              <button
                key={`${hex}-${index}`}
                onClick={() => !disabled && onColorChange(color)}
                disabled={disabled}
                title={name}
                className={`
                  relative w-8 h-8 rounded-lg border-2 transition-all duration-200
                  ${isSelected ? 'border-primary scale-110' : 'border-border hover:border-primary/50 hover:scale-105'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className={`w-4 h-4 ${color.r > 200 && color.g > 200 && color.b > 200 ? 'text-foreground' : 'text-white'}`} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
