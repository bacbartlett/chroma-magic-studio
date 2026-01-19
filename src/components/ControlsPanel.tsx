import { motion } from 'framer-motion';
import { Sliders, Blend, Palette, Target } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { hexToRgb, rgbToHex } from '@/lib/chromaKey';
import type { ChromaKeySettings } from '@/lib/chromaKey';
import { useState, useEffect } from 'react';

interface ControlsPanelProps {
  settings: ChromaKeySettings;
  onSettingsChange: (settings: Partial<ChromaKeySettings>) => void;
  disabled?: boolean;
}

export function ControlsPanel({ settings, onSettingsChange, disabled = false }: ControlsPanelProps) {
  const { tolerance, edgeSmoothing, fillMode, replacementColor, selectionMode } = settings;
  const [toleranceInput, setToleranceInput] = useState<string>(tolerance.toString());
  const [edgeSmoothingInput, setEdgeSmoothingInput] = useState<string>(edgeSmoothing.toString());

  // Update input when tolerance changes from slider
  const handleToleranceSliderChange = (value: number) => {
    setToleranceInput(value.toString());
    onSettingsChange({ tolerance: value });
  };

  // Handle input change
  const handleToleranceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToleranceInput(value);
    
    // Update immediately if valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onSettingsChange({ tolerance: Math.round(numValue) });
    }
  };

  // Handle input blur - clamp to valid range
  const handleToleranceInputBlur = () => {
    const numValue = parseFloat(toleranceInput);
    if (isNaN(numValue) || numValue < 0) {
      setToleranceInput('0');
      onSettingsChange({ tolerance: 0 });
    } else if (numValue > 100) {
      setToleranceInput('100');
      onSettingsChange({ tolerance: 100 });
    } else {
      setToleranceInput(Math.round(numValue).toString());
      onSettingsChange({ tolerance: Math.round(numValue) });
    }
  };

  // Sync input when tolerance changes externally
  useEffect(() => {
    setToleranceInput(tolerance.toString());
  }, [tolerance]);

  // Update input when edge smoothing changes from slider
  const handleEdgeSmoothingSliderChange = (value: number) => {
    setEdgeSmoothingInput(value.toString());
    onSettingsChange({ edgeSmoothing: value });
  };

  // Handle edge smoothing input change
  const handleEdgeSmoothingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEdgeSmoothingInput(value);
    
    // Update immediately if valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      onSettingsChange({ edgeSmoothing: Math.round(numValue) });
    }
  };

  // Handle edge smoothing input blur - clamp to valid range
  const handleEdgeSmoothingInputBlur = () => {
    const numValue = parseFloat(edgeSmoothingInput);
    if (isNaN(numValue) || numValue < 0) {
      setEdgeSmoothingInput('0');
      onSettingsChange({ edgeSmoothing: 0 });
    } else if (numValue > 20) {
      setEdgeSmoothingInput('20');
      onSettingsChange({ edgeSmoothing: 20 });
    } else {
      setEdgeSmoothingInput(Math.round(numValue).toString());
      onSettingsChange({ edgeSmoothing: Math.round(numValue) });
    }
  };

  // Sync input when edge smoothing changes externally
  useEffect(() => {
    setEdgeSmoothingInput(edgeSmoothing.toString());
  }, [edgeSmoothing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Tolerance Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            Tolerance
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={toleranceInput}
              onChange={handleToleranceInputChange}
              onBlur={handleToleranceInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              min={0}
              max={100}
              step={1}
              disabled={disabled}
              className="w-20 h-8 text-sm font-mono text-center"
            />
            <span className="text-sm font-mono text-muted-foreground">%</span>
          </div>
        </div>
        <Slider
          value={[tolerance]}
          onValueChange={([value]) => handleToleranceSliderChange(value)}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          {tolerance === 0 ? 'Exact match only' : tolerance >= 100 ? 'Removes all pixels' : 'How similar colors must be to be removed'}
        </p>
      </div>

      {/* Edge Smoothing Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Blend className="w-4 h-4 text-muted-foreground" />
            Edge Smoothing
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edgeSmoothingInput}
              onChange={handleEdgeSmoothingInputChange}
              onBlur={handleEdgeSmoothingInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              min={0}
              max={20}
              step={1}
              disabled={disabled || fillMode === 'replacement'}
              className="w-20 h-8 text-sm font-mono text-center"
            />
            <span className="text-sm font-mono text-muted-foreground">px</span>
          </div>
        </div>
        <Slider
          value={[edgeSmoothing]}
          onValueChange={([value]) => handleEdgeSmoothingSliderChange(value)}
          min={0}
          max={20}
          step={1}
          disabled={disabled || fillMode === 'replacement'}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          {fillMode === 'replacement' 
            ? 'Only available with transparent fill'
            : edgeSmoothing === 0 
              ? 'Sharp edges' 
              : 'Feathers the transition between removed and kept areas'
          }
        </p>
      </div>

      {/* Fill Mode Toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          Fill Mode
        </Label>
        
        <div className="flex gap-2">
          <button
            onClick={() => !disabled && onSettingsChange({ fillMode: 'transparent' })}
            disabled={disabled}
            className={`
              flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
              ${fillMode === 'transparent' 
                ? 'border-primary bg-accent' 
                : 'border-border bg-secondary/50 hover:border-primary/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="w-6 h-6 mx-auto mb-2 rounded border border-border checkerboard" />
            <p className="text-xs font-medium text-foreground">Transparent</p>
          </button>
          
          <button
            onClick={() => !disabled && onSettingsChange({ fillMode: 'replacement' })}
            disabled={disabled}
            className={`
              flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
              ${fillMode === 'replacement' 
                ? 'border-primary bg-accent' 
                : 'border-border bg-secondary/50 hover:border-primary/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div 
              className="w-6 h-6 mx-auto mb-2 rounded border border-border"
              style={{ backgroundColor: rgbToHex(replacementColor.r, replacementColor.g, replacementColor.b) }}
            />
            <p className="text-xs font-medium text-foreground">Replace Color</p>
          </button>
        </div>

        {/* Replacement Color Picker */}
        {fillMode === 'replacement' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2"
          >
            <label className="flex items-center gap-2 h-10 px-3 bg-secondary hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors">
              <span className="text-sm text-foreground">Replacement Color</span>
              <input
                type="color"
                value={rgbToHex(replacementColor.r, replacementColor.g, replacementColor.b)}
                onChange={(e) => {
                  const rgb = hexToRgb(e.target.value);
                  if (rgb) onSettingsChange({ replacementColor: rgb });
                }}
                disabled={disabled}
                className="ml-auto w-8 h-8 rounded border-0 cursor-pointer"
              />
            </label>
          </motion.div>
        )}
      </div>

      {/* Selection Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          Selection Mode
        </Label>
        
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {selectionMode === 'outer' ? 'Outer Only' : 'All Matching'}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectionMode === 'outer' 
                ? 'Only removes pixels connected to edges'
                : 'Removes all matching pixels everywhere'
              }
            </p>
          </div>
          <Switch
            checked={selectionMode === 'outer'}
            onCheckedChange={(checked) => onSettingsChange({ selectionMode: checked ? 'outer' : 'all' })}
            disabled={disabled}
          />
        </div>
      </div>
    </motion.div>
  );
}
