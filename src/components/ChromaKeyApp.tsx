import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Upload } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ColorSelector } from './ColorSelector';
import { ControlsPanel } from './ControlsPanel';
import { PreviewCanvas } from './PreviewCanvas';
import { ExportButton } from './ExportButton';
import { processChromaKey, getColorAtPosition, type ChromaKeySettings } from '@/lib/chromaKey';
import { Button } from '@/components/ui/button';

const DEFAULT_SETTINGS: ChromaKeySettings = {
  targetColor: { r: 0, g: 255, b: 0 },
  tolerance: 30,
  edgeSmoothing: 2,
  fillMode: 'transparent',
  replacementColor: { r: 255, g: 255, b: 255 },
  selectionMode: 'all',
};

export function ChromaKeyApp() {
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [settings, setSettings] = useState<ChromaKeySettings>(DEFAULT_SETTINGS);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState('image');
  
  const processingTimeoutRef = useRef<number | null>(null);

  const handleImageLoad = useCallback((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);
    setSourceCanvas(canvas);
    setIsEyedropperActive(false);

    // Extract filename from data URL or set default
    const src = image.src;
    if (src.includes('name=')) {
      const match = src.match(/name=([^;]+)/);
      if (match) setFilename(decodeURIComponent(match[1]));
    }
  }, []);

  const handleColorPick = useCallback((x: number, y: number) => {
    if (!sourceCanvas) return;

    const color = getColorAtPosition(sourceCanvas, x, y);
    if (color) {
      setSettings(prev => ({ ...prev, targetColor: color }));
      setIsEyedropperActive(false);
    }
  }, [sourceCanvas]);

  const updateSettings = useCallback((partial: Partial<ChromaKeySettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  // Process with debounce
  useEffect(() => {
    if (!sourceCanvas) return;

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setIsProcessing(true);

    processingTimeoutRef.current = window.setTimeout(() => {
      const result = processChromaKey(sourceCanvas, settings);
      setProcessedImageData(result);
      setIsProcessing(false);
    }, 150);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [sourceCanvas, settings]);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const handleClearImage = useCallback(() => {
    setSourceCanvas(null);
    setProcessedImageData(null);
    setFilename('image');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-soft-md">
              <span className="text-primary-foreground font-bold text-lg">CK</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ChromaKey Pro</h1>
              <p className="text-xs text-muted-foreground">Remove backgrounds instantly</p>
            </div>
          </div>

          {sourceCanvas && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearImage}>
                <Upload className="w-4 h-4 mr-2" />
                New Image
              </Button>
            </div>
          )}
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        {!sourceCanvas ? (
          /* Upload State */
          <div className="max-w-2xl mx-auto py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Remove any color from your image
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload an image and select a color to remove. Perfect for green screens, 
                product photos, and background removal.
              </p>
            </motion.div>

            <ImageUploader onImageLoad={handleImageLoad} />

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-4 mt-8"
            >
              {[
                { title: 'Eyedropper', desc: 'Click to pick colors' },
                { title: 'Edge Smoothing', desc: 'Feathered transitions' },
                { title: 'Real-time', desc: 'Instant preview' },
              ].map((feature, i) => (
                <div key={feature.title} className="text-center p-4">
                  <p className="font-medium text-foreground text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          /* Editor State */
          <div className="flex gap-6 min-h-[calc(100vh-140px)]">
            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-72 flex-shrink-0 space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm space-y-6">
                <ColorSelector
                  selectedColor={settings.targetColor}
                  onColorChange={(color) => updateSettings({ targetColor: color })}
                  isEyedropperActive={isEyedropperActive}
                  onEyedropperToggle={() => setIsEyedropperActive(!isEyedropperActive)}
                />

                <div className="border-t border-border pt-6">
                  <ControlsPanel
                    settings={settings}
                    onSettingsChange={updateSettings}
                  />
                </div>

                <div className="border-t border-border pt-6">
                  <ExportButton
                    processedImageData={processedImageData}
                    originalFilename={filename}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Processing indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Processing...
                </motion.div>
              )}
            </motion.aside>

            {/* Preview Area */}
            <PreviewCanvas
              originalCanvas={sourceCanvas}
              processedImageData={processedImageData}
              isEyedropperActive={isEyedropperActive}
              onColorPick={handleColorPick}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          All processing happens in your browser. Your images never leave your device.
        </div>
      </footer>
    </div>
  );
}
