import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  processedImageData: ImageData | null;
  originalFilename?: string;
  disabled?: boolean;
}

export const ExportButton = forwardRef<HTMLButtonElement, ExportButtonProps>(function ExportButton(
  { processedImageData, originalFilename = 'image', disabled = false },
  ref
) {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    if (!processedImageData || isExporting) return;

    setIsExporting(true);

    try {
      // Create canvas with processed image
      const canvas = document.createElement('canvas');
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.putImageData(processedImageData, 0, 0);

      // Export as PNG blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) throw new Error('Failed to create blob');

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Remove extension and add -chromakey.png suffix
      const baseName = originalFilename.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}-chromakey.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      ref={ref}
      onClick={handleExport}
      disabled={disabled || !processedImageData || isExporting}
      size="lg"
      className="w-full relative overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isExporting ? (
          <motion.span
            key="exporting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </motion.span>
        ) : showSuccess ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Downloaded!
          </motion.span>
        ) : (
          <motion.span
            key="download"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
});
