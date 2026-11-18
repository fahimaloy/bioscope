'use client';

import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  DragEvent,
  ChangeEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { FOCUS_VISIBLE } from './shared';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (files: File[] | string[]) => void;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  showPreview?: boolean;
  removable?: boolean;
  uploadAction?: (files: File[]) => Promise<string[]>;
}

interface UploadedFile {
  file: File | null;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  url?: string;
}

export const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(function ImageUpload(
  {
    value,
    onChange,
    accept = 'image/*',
    maxSize = 10,
    maxFiles = 1,
    multiple = false,
    disabled = false,
    label,
    hint,
    error,
    className,
    showPreview = true,
    removable = true,
    uploadAction,
  },
  ref
) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setFiles(
        urls.map((url) => ({
          file: null,
          preview: url,
          progress: 100,
          status: 'complete' as const,
          url,
        }))
      );
    }
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.match(accept.replace('*', '.*'))) {
      return `File type not allowed. Accepted: ${accept}`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles = fileArray.filter((file) => {
        const err = validateFile(file);
        if (err) {
          // Could show toast here
          console.warn(err);
          return false;
        }
        return true;
      });

      if (!multiple && validFiles.length > 1) {
        // Only take first file for single upload
        validFiles.splice(1);
      }

      if (files.length + validFiles.length > maxFiles) {
        console.warn(`Maximum ${maxFiles} files allowed`);
        validFiles.splice(maxFiles - files.length);
      }

      const newUploads: UploadedFile[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const,
      }));

      setFiles((prev) => [...prev, ...newUploads]);

      if (uploadAction) {
        setUploading(true);
        try {
          const urls = await uploadAction(validFiles);
          setFiles((prev) =>
            prev.map((f, i) => {
              const newIndex = i - (prev.length - newUploads.length);
              if (newIndex >= 0 && newIndex < urls.length) {
                return { ...f, progress: 100, status: 'complete' as const, url: urls[newIndex] };
              }
              return f;
            })
          );
          onChange(files.map((f) => f.url || f.preview).concat(urls));
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              validFiles.some((vf) => vf === f.file)
                ? { ...f, status: 'error' as const, error: 'Upload failed' }
                : f
            )
          );
        } finally {
          setUploading(false);
        }
      } else {
        onChange([...files.map((f) => f.url || f.preview), ...newUploads.map((u) => u.preview)]);
      }
    },
    [files, maxFiles, multiple, onChange, uploadAction, validateFile]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const file = prev[index];
        if (file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
        const next = prev.filter((_, i) => i !== index);
        onChange(next.map((f) => f.url || f.preview));
        return next;
      });
    },
    [onChange]
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input value to allow selecting same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  const currentFiles =
    files.length > 0
      ? files
      : value
        ? (Array.isArray(value) ? value : [value]).map((url) => ({
            file: null,
            preview: url,
            progress: 100,
            status: 'complete' as const,
            url,
          }))
        : [];

  return (
    <div ref={ref} className={cn('w-full', className)}>
      {label && <label className="mb-2 block text-sm font-medium text-[var(--ink)]">{label}</label>}

      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-[3px] transition-colors duration-fast',
          'p-8',
          dragActive
            ? 'border-[var(--gold)] bg-[var(--paper-deep)]'
            : error
              ? 'border-[var(--error)]'
              : 'border-[var(--ink)] bg-[var(--surface-raised)] hover:border-[var(--gold)]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={handleInputChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Upload images"
        />

        {currentFiles.length > 0 && showPreview && (
          <div className="absolute inset-0 h-full w-full overflow-auto p-4">
            <div className={cn('flex flex-wrap gap-3', multiple ? '' : 'justify-center')}>
              {currentFiles.map((file, index) => (
                <div
                  key={index}
                  className={cn(
                    'group relative',
                    multiple ? 'h-32 w-32 flex-shrink-0' : 'max-h-[300px] max-w-full'
                  )}
                >
                  <div className="aspect-square overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-[var(--paper-deep)]">
                    {file.status === 'uploading' ? (
                      <div className="bg-[color-mix(in_srgb,var(--surface-raised)_80%,transparent)] absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--ink)]" />
                        <div className="absolute bottom-2 text-xs text-[var(--text-muted)]">
                          {file.progress}%
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.preview}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {removable && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className={cn(
                        'absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full',
                        'bg-[var(--error)] text-[var(--on-red)] transition-opacity',
                        'opacity-0 focus-visible:opacity-100 group-hover:opacity-100',
                        FOCUS_VISIBLE
                      )}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {file.status === 'complete' && (
                    <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--green-strong)] text-[var(--on-green-strong)]">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--error)] text-[var(--on-red)]">
                      <X className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentFiles.length === 0 && (
          <div className="pointer-events-none text-center">
            <Upload
              className="mx-auto mb-3 h-12 w-12 text-[var(--text-subtle)]"
              aria-hidden="true"
            />
            <p className="text-body mb-1 text-[var(--text-muted)]">
              {multiple
                ? 'Drag & drop images here, or click to select'
                : 'Drag & drop an image here, or click to select'}
            </p>
            {hint && <p className="text-sm text-[var(--text-subtle)]">{hint}</p>}
            <p className="mt-2 text-xs text-[var(--text-subtle)]">
              {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {maxSize}MB • {accept}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-[var(--error)]" role="alert">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';
