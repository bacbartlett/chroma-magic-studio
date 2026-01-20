import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Upload, Shield, Zap, Eye, Palette, Download, MousePointer } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ColorSelector } from './ColorSelector';
import { ControlsPanel } from './ControlsPanel';
import { PreviewCanvas } from './PreviewCanvas';
import { ExportButton } from './ExportButton';
import { processChromaKey, getColorAtPosition, type ChromaKeySettings } from '@/lib/chromaKey';
import { Button } from '@/components/ui/button';

const DEFAULT_SETTINGS: ChromaKeySettings = {
  targetColor: { r: 0, g: 255, b: 0 },
  tolerance: 10,
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

  const handleImageLoad = useCallback((image: HTMLImageElement, filename: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);
    setSourceCanvas(canvas);
    setIsEyedropperActive(false);

    // Store the original filename
    setFilename(filename || 'image');
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
    <div className="min-h-screen gradient-background relative">
      {/* Header with semantic nav */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-primary/20 bg-gradient-to-r from-[hsl(200_75%_45%)] to-[hsl(210_80%_50%)] sticky top-0 z-50 shadow-soft-lg"
        style={{ backgroundColor: 'hsl(200 75% 45%)' }}
        role="banner"
      >
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between" aria-label="Main navigation">
          <a href="/" className="flex items-center gap-3" aria-label="ChromaKey Free - Home">
            <img 
              src="/transparentjustlogo.png" 
              alt="ChromaKey Free - Free Online Background Remover and Chroma Key Tool" 
              className="h-10 w-auto"
              width="40"
              height="40"
            />
            <div>
              <h1 className="text-lg font-semibold text-white">ChromaKey Free</h1>
              <p className="text-xs text-white/80">Online Background Remover</p>
            </div>
          </a>

          {sourceCanvas && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                aria-label="Reset all settings to default"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Reset
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearImage}
                className="text-white/90 hover:text-white hover:bg-white/10"
                aria-label="Upload a new image"
              >
                <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                New Image
              </Button>
            </div>
          )}
        </nav>
      </motion.header>

      <main className="container mx-auto px-4 py-6" role="main">
        {!sourceCanvas ? (
          /* Upload State - SEO optimized landing content */
          <article className="max-w-4xl mx-auto py-8">
            {/* Hero Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 bg-card/60 backdrop-blur-sm rounded-2xl p-8 shadow-soft-lg border border-border/50"
              aria-labelledby="hero-heading"
            >
              <h2 id="hero-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Free Online Chroma Key & Background Remover
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Remove green screens, blue screens, or any color from your images instantly. 
                Perfect for product photography, portraits, video thumbnails, and creative projects.
                <strong className="block mt-2 text-foreground/80">100% free, no signup required.</strong>
              </p>
            </motion.section>

            {/* Image Uploader */}
            <section aria-label="Upload your image">
              <ImageUploader onImageLoad={handleImageLoad} />
            </section>

            {/* Features Grid - SEO optimized */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10"
              aria-labelledby="features-heading"
            >
              <h3 id="features-heading" className="sr-only">Key Features of Our Background Remover</h3>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <MousePointer className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">Eyedropper Tool</p>
                <p className="text-xs text-muted-foreground mt-1">Click any color to remove it from your image</p>
              </div>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <Palette className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">Any Color Removal</p>
                <p className="text-xs text-muted-foreground mt-1">Green screen, blue screen, or any custom color</p>
              </div>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <Zap className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">Real-time Preview</p>
                <p className="text-xs text-muted-foreground mt-1">See changes instantly as you adjust settings</p>
              </div>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <Eye className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">Edge Smoothing</p>
                <p className="text-xs text-muted-foreground mt-1">Professional feathered edges for seamless results</p>
              </div>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <Download className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">PNG Export</p>
                <p className="text-xs text-muted-foreground mt-1">Download with transparent background</p>
              </div>
              
              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/30">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">100% Private</p>
                <p className="text-xs text-muted-foreground mt-1">Images never leave your device</p>
              </div>
            </motion.section>

            {/* SEO Content Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 bg-card/40 rounded-2xl p-8 border border-border/30"
              aria-labelledby="how-it-works-heading"
            >
              <h3 id="how-it-works-heading" className="text-xl font-semibold text-foreground mb-4">
                How to Remove Backgrounds from Images
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Upload your image</strong> – Drag and drop or click to select a PNG, JPG, or WebP file</li>
                <li><strong className="text-foreground">Select the color to remove</strong> – Use the eyedropper to pick the background color</li>
                <li><strong className="text-foreground">Adjust tolerance & smoothing</strong> – Fine-tune for perfect edges</li>
                <li><strong className="text-foreground">Download your result</strong> – Export as PNG with transparent background</li>
              </ol>
            </motion.section>

            {/* Use Cases - Additional SEO content */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 grid md:grid-cols-2 gap-6"
              aria-labelledby="use-cases-heading"
            >
              <h3 id="use-cases-heading" className="sr-only">Common Use Cases for Background Removal</h3>
              
              <div className="bg-card/40 rounded-xl p-6 border border-border/30">
                <h4 className="font-semibold text-foreground mb-2">🎬 Green Screen Removal</h4>
                <p className="text-sm text-muted-foreground">
                  Perfect for content creators and streamers. Remove green screen backgrounds from 
                  thumbnails, promotional images, and social media posts.
                </p>
              </div>
              
              <div className="bg-card/40 rounded-xl p-6 border border-border/30">
                <h4 className="font-semibold text-foreground mb-2">🛍️ Product Photography</h4>
                <p className="text-sm text-muted-foreground">
                  Create professional product photos with clean, transparent backgrounds. 
                  Ideal for e-commerce, marketplaces, and online stores.
                </p>
              </div>
              
              <div className="bg-card/40 rounded-xl p-6 border border-border/30">
                <h4 className="font-semibold text-foreground mb-2">👤 Portrait Editing</h4>
                <p className="text-sm text-muted-foreground">
                  Remove backgrounds from headshots, profile pictures, and portraits. 
                  Replace with custom colors or keep transparent.
                </p>
              </div>
              
              <div className="bg-card/40 rounded-xl p-6 border border-border/30">
                <h4 className="font-semibold text-foreground mb-2">🎨 Graphic Design</h4>
                <p className="text-sm text-muted-foreground">
                  Isolate elements from images for collages, composites, and creative designs. 
                  Export with transparency for layering in design software.
                </p>
              </div>
            </motion.section>
          </article>
        ) : (
          /* Editor State */
          <div className="flex gap-6 min-h-[calc(100vh-140px)]">
            {/* Sidebar - Controls Panel */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-72 flex-shrink-0 space-y-6"
              aria-label="Chroma key settings and controls"
            >
              <div className="bg-card/95 backdrop-blur-sm rounded-xl border border-border/50 p-5 shadow-soft-lg space-y-6">
                <ColorSelector
                  selectedColor={settings.targetColor}
                  onColorChange={(color) => updateSettings({ targetColor: color })}
                  isEyedropperActive={isEyedropperActive}
                  onEyedropperToggle={() => setIsEyedropperActive(!isEyedropperActive)}
                  sourceCanvas={sourceCanvas}
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

      {/* Footer with SEO content */}
      <footer className="border-t border-border/50 bg-card/60 backdrop-blur-sm py-8 mt-8" role="contentinfo">
        <div className="container mx-auto px-4">
          {/* Privacy notice */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            <Shield className="w-4 h-4 inline mr-1" aria-hidden="true" />
            <strong>Your privacy is protected.</strong> All image processing happens entirely in your browser using JavaScript. 
            Your images are never uploaded to any server.
          </p>
          
          {/* SEO Footer Links */}
          <div className="border-t border-border/30 pt-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">About ChromaKey Free</h4>
                <p>
                  Free online chroma key tool for removing backgrounds from images. 
                  Works with green screens, blue screens, and any color you choose.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Supported Formats</h4>
                <p>
                  Upload PNG, JPG, JPEG, GIF, or WebP images. 
                  Export results as PNG with transparent backgrounds.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">No Account Required</h4>
                <p>
                  Start removing backgrounds immediately. No signup, no email, no watermarks. 
                  Completely free to use.
                </p>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <p className="text-center text-xs text-muted-foreground/70 mt-6">
            © {new Date().getFullYear()} ChromaKey Free. Free online background remover and chroma key tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
