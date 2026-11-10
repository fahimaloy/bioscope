'use client'

import { useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Upload, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { FabricImage } from '@/types'

interface UploadZoneProps {
  onUpload: (file: File, fabricImage: FabricImage) => void
  acceptedTypes?: string
  maxSize?: number // MB
  multiple?: boolean
  disabled?: boolean
  currentImage?: FabricImage | null
  onRemove?: () => void
  className?: string
}

export function UploadZone({
  onUpload,
  acceptedTypes = 'image/*',
  maxSize = 16,
  multiple = false,
  disabled = false,
  currentImage,
  onRemove,
  className,
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.match(acceptedTypes.replace('*', '.*'))) {
      return 'Invalid file type. Please upload an image.'
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit.`
    }
    return null
  }, [acceptedTypes, maxSize])

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      setError(error)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Create FabricImage object
      const fabricImage: FabricImage = {
        id: crypto.randomUUID(),
        url: previewUrl,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        left: 0,
        top: 0,
      }

      // Get image dimensions
      const img = new window.Image()
      img.onload = () => {
        fabricImage.width = img.width
        fabricImage.height = img.height
        onUpload(file, fabricImage)
        setUploading(false)
      }
      img.src = previewUrl
    } catch (err) {
      setError('Failed to process image')
      setUploading(false)
    }
  }, [onUpload, validateFile])

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (!multiple && fileArray.length > 1) {
        handleFile(fileArray[0])
      } else if (multiple) {
        fileArray.forEach(handleFile)
      }
    },
    [handleFile, multiple]
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFiles]
  )

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    onRemove?.()
  }

  const displayImage = currentImage?.url || preview

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        disabled={disabled || uploading}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload image"
      />

      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-3 rounded-card transition-all duration-200',
          'flex flex-col items-center justify-center p-8',
          dragActive
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-red-500'
            : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] hover:border-primary',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        {displayImage ? (
          <>
            <div className="relative w-full max-w-md aspect-square rounded-input overflow-hidden border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] bg-[var(--light)]">
              <img
                src={displayImage}
                alt="Uploaded design preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>

            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage() }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <Upload className="w-16 h-16 text-[color-mix(in_srgb,var(--ink)_30%,transparent)] mx-auto mb-4" />
            <p className="text-body text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mb-2">
              {multiple ? 'Drag & drop images here, or click to select' : 'Drag & drop an image here, or click to select'}
            </p>
            <p className="text-sm text-[color-mix(in_srgb,var(--ink)_40%,transparent)] mb-4">
              {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {maxSize}MB • {acceptedTypes}
            </p>
            <Button variant="secondary" size="sm" disabled={disabled || uploading}>
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-input flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Paste Support */}
      <div className="mt-4 text-center">
        <kbd className="px-2 py-1 text-xs bg-[var(--light)] text-[color-mix(in_srgb,var(--ink)_60%,transparent)] rounded border border-[color-mix(in_srgb,var(--ink)_20%,transparent)] font-mono">
          Ctrl + V
        </kbd>{' '}
        <span className="text-sm text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">to paste image from clipboard</span>
      </div>
    </div>
  )
}

// Need to import useRef
import { useRef } from 'react'

// Maximum files constant
const maxFiles = 10

// Compact upload for additional images
export function CompactUploadZone({
  onUpload,
  maxFiles = 5,
  acceptedTypes = 'image/*',
  maxSize = 10,
  disabled = false,
  className,
}: {
  onUpload: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string
  maxSize?: number
  disabled?: boolean
  className?: string
}) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (!file.type.match(acceptedTypes.replace('*', '.*'))) return false
      if (file.size > maxSize * 1024 * 1024) return false
      return true
    })

    const combined = [...files, ...validFiles].slice(0, maxFiles)
    setFiles(combined)
    onUpload(combined)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {files.map((file, index) => (
        <div key={index} className="relative w-20 h-20 rounded-input overflow-hidden border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
          <img src={URL.createObjectURL(file)} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              const next = files.filter((_, i) => i !== index)
              setFiles(next)
              onUpload(next)
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {files.length < maxFiles && (
        <div
          className={cn(
            'w-20 h-20 rounded-input border-3 border-dashed flex items-center justify-center cursor-pointer transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] hover:border-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (e.dataTransfer.files) handleFiles(Array.from(e.dataTransfer.files))
          }}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = acceptedTypes
            input.multiple = true
            input.onchange = (e) => {
              const t = e.target as HTMLInputElement | null
              if (t?.files) handleFiles(Array.from(t.files))
            }
            input.click()
          }}
        >
          <span className="text-2xl text-[color-mix(in_srgb,var(--ink)_40%,transparent)]">+</span>
        </div>
      )}
    </div>
  )
}