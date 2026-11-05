'use client'

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Upload, X, Image, Loader2, CheckCircle } from 'lucide-react'

interface ImageUploadProps {
  value?: string | string[]
  onChange: (files: File[] | string[]) => void
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  label?: string
  hint?: string
  error?: string
  className?: string
  showPreview?: boolean
  removable?: boolean
  uploadAction?: (files: File[]) => Promise<string[]>
}

interface UploadedFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  url?: string
}

export function ImageUpload({
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
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value]
      setFiles(
        urls.map((url) => ({
          file: null as any,
          preview: url,
          progress: 100,
          status: 'complete' as const,
          url,
        }))
      )
    }
  }, [value])

  const validateFile = (file: File): string | null => {
    if (!file.type.match(accept.replace('*', '.*'))) {
      return `File type not allowed. Accepted: ${accept}`
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }
    return null
  }

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles = fileArray.filter((file) => {
        const err = validateFile(file)
        if (err) {
          // Could show toast here
          console.warn(err)
          return false
        }
        return true
      })

      if (!multiple && validFiles.length > 1) {
        // Only take first file for single upload
        validFiles.splice(1)
      }

      if (files.length + validFiles.length > maxFiles) {
        console.warn(`Maximum ${maxFiles} files allowed`)
        validFiles.splice(maxFiles - files.length)
      }

      const newUploads: UploadedFile[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const,
      }))

      setFiles((prev) => [...prev, ...newUploads])

      if (uploadAction) {
        setUploading(true)
        try {
          const urls = await uploadAction(validFiles)
          setFiles((prev) =>
            prev.map((f, i) => {
              const newIndex = i - (prev.length - newUploads.length)
              if (newIndex >= 0 && newIndex < urls.length) {
                return { ...f, progress: 100, status: 'complete' as const, url: urls[newIndex] }
              }
              return f
            })
          )
          onChange(files.map((f) => f.url || f.preview).concat(urls))
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              validFiles.some((vf) => vf === f.file)
                ? { ...f, status: 'error' as const, error: 'Upload failed' }
                : f
            )
          )
        } finally {
          setUploading(false)
        }
      } else {
        onChange([...files.map((f) => f.url || f.preview), ...newUploads.map((u) => u.preview)])
      }
    },
    [files, maxFiles, multiple, onChange, uploadAction]
  )

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const file = prev[index]
        if (file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview)
        }
        const next = prev.filter((_, i) => i !== index)
        onChange(next.map((f) => f.url || f.preview))
        return next
      })
    },
    [onChange]
  )

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
      // Reset input value to allow selecting same file again
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [handleFiles]
  )

  const triggerFileSelect = () => {
    inputRef.current?.click()
  }

  const currentFiles = files.length > 0 ? files : value ? (Array.isArray(value) ? value : [value]).map((url, i) => ({
    file: null as any,
    preview: url,
    progress: 100,
    status: 'complete' as const,
    url,
  })) : []

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="block text-sm font-medium text-[var(--ink)] mb-2">{label}</label>}

      <div
        className={cn(
          'relative border-3 rounded-card transition-all duration-200',
          'flex flex-col items-center justify-center p-8',
          dragActive
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-red-500'
            : 'border-[var(--ink)]/30 hover:border-primary',
          disabled && 'opacity-60 cursor-not-allowed'
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload images"
        />

        {currentFiles.length > 0 && showPreview && (
          <div className="absolute inset-0 w-full h-full p-4 overflow-auto">
            <div className={cn('flex flex-wrap gap-3', multiple ? '' : 'justify-center')}>
              {currentFiles.map((file, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative group',
                    multiple ? 'w-32 h-32 flex-shrink-0' : 'max-w-full max-h-[300px]'
                  )}
                >
                  <div className="aspect-square rounded-input overflow-hidden border-2 border-[var(--ink)]/20 bg-[var(--light)]">
                    {file.status === 'uploading' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <div className="absolute bottom-2 text-xs text-[var(--ink)]/60">
                          {file.progress}%
                        </div>
                      </div>
                    ) : (
                      <img
                        src={file.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {removable && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {file.status === 'complete' && (
                    <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentFiles.length === 0 && (
          <div className="text-center pointer-events-none">
            <Upload className="w-12 h-12 text-[var(--ink)]/30 mx-auto mb-3" />
            <p className="text-body text-[var(--ink)]/60 mb-1">
              {multiple ? 'Drag & drop images here, or click to select' : 'Drag & drop an image here, or click to select'}
            </p>
            {hint && <p className="text-sm text-[var(--ink)]/40">{hint}</p>}
            <p className="text-xs text-[var(--ink)]/30 mt-2">
              {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {maxSize}MB • {accept}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}