import { useState, useCallback } from 'react';
import { CloudUpload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ minHeight: '500px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto cursor-pointer transition-all duration-200"
        style={{
          height: '420px',
          border: isDragOver ? '2px solid var(--accent-blue)' : '2px dashed var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: isDragOver ? 'rgba(59,130,246,0.05)' : 'var(--bg-primary)',
          perspective: '1000px',
          transform: isDragOver ? 'rotateX(2deg) translateZ(10px)' : 'rotateX(0)',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={(el) => { fileInputRef.current = el; }}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="animate-float mb-4">
          <CloudUpload
            size={64}
            style={{
              color: 'var(--accent-blue)',
              opacity: isDragOver ? 1 : 0.7,
              transition: 'all 200ms',
            }}
          />
        </div>

        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {isDragOver ? t('vision.dropActive') : t('vision.dropzone')}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {t('vision.pasteScreenshot')}
        </p>

        <div className="flex items-center gap-2 mb-3">
          {['PNG', 'JPG', 'WEBP'].map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 rounded-full text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              {fmt}
            </span>
          ))}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('vision.supportedFormats')}
        </p>
      </div>
    </div>
  );
}
