import { useRef, useEffect, useCallback, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Move, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewCanvasProps {
  originalCanvas: HTMLCanvasElement | null;
  processedImageData: ImageData | null;
  isEyedropperActive: boolean;
  onColorPick: (x: number, y: number) => void;
  isProcessing?: boolean;
}

export const PreviewCanvas = forwardRef<HTMLDivElement, PreviewCanvasProps>(function PreviewCanvas({
  originalCanvas,
  processedImageData,
  isEyedropperActive,
  onColorPick,
  isProcessing = false,
}, ref) {
  const originalRef = useRef<HTMLCanvasElement>(null);
  const processedRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Draw original image
  useEffect(() => {
    if (!originalCanvas || !originalRef.current) return;

    const canvas = originalRef.current;
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(originalCanvas, 0, 0);
  }, [originalCanvas]);

  // Draw processed image
  useEffect(() => {
    if (!processedImageData || !processedRef.current) return;

    const canvas = processedRef.current;
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(processedImageData, 0, 0);
  }, [processedImageData]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !originalCanvas) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    onColorPick(x, y);
  }, [isEyedropperActive, originalCanvas, onColorPick]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoom(1);

  if (!originalCanvas) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-border/50 shadow-soft-sm">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Move className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Upload an image to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col gap-4"
    >
      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-white rounded-xl border border-border/50 shadow-soft-lg"
      >
        <div
          className="flex gap-4 p-4 min-w-max"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* Original Image */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original</p>
            <div className="relative rounded-lg overflow-hidden shadow-soft-lg border border-border/50 bg-white">
              <canvas
                ref={originalRef}
                onClick={handleCanvasClick}
                className={`
                  max-w-full h-auto block
                  ${isEyedropperActive ? 'cursor-crosshair' : 'cursor-default'}
                `}
                style={{ maxHeight: '60vh' }}
              />
              {isEyedropperActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/5 pointer-events-none border-2 border-primary/30 rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Processed Image */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Processed</p>
            <div className="relative rounded-lg overflow-hidden shadow-soft-lg border border-border checkerboard">
              <canvas
                ref={processedRef}
                className="max-w-full h-auto block"
                style={{ maxHeight: '60vh' }}
              />
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-sm font-medium text-foreground">Processing...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Image Info */}
      {originalCanvas && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>
            {originalCanvas.width} × {originalCanvas.height}px
          </span>
          <span>•</span>
          <span>
            {(originalCanvas.width * originalCanvas.height / 1000000).toFixed(2)} MP
          </span>
        </div>
      )}
    </motion.div>
  );
});
