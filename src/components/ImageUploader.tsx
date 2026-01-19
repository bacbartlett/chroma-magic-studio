import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

const MAX_DIMENSION = 4096;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);
    setIsLoading(true);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, or WEBP)');
      setIsLoading(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 20MB');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          setError(`Image too large. Maximum dimension is ${MAX_DIMENSION}px`);
          setIsLoading(false);
          return;
        }
        onImageLoad(img);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError('Failed to load image. Please try another file.');
        setIsLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[320px] p-8
          border-2 border-dashed rounded-xl
          cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-primary bg-accent/80 backdrop-blur-sm scale-[1.02] shadow-soft-lg' 
            : 'border-border/70 bg-card/90 backdrop-blur-sm hover:border-primary/50 hover:bg-accent/40 shadow-soft-md'
          }
        `}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading image...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ 
                  scale: isDragging ? 1.1 : 1,
                  rotate: isDragging ? 5 : 0 
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`
                  p-5 rounded-2xl
                  ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}
                  transition-colors duration-300
                `}
              >
                {isDragging ? (
                  <ImageIcon className="w-10 h-10" />
                ) : (
                  <Upload className="w-10 h-10" />
                )}
              </motion.div>

              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isDragging ? 'Drop your image here' : 'Drag & drop your image'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or <span className="text-primary font-medium hover:underline">browse files</span>
                </p>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  Supports PNG, JPG, WEBP • Max 20MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </motion.div>
  );
}
