"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  folder?: string
  className?: string
  aspectRatio?: "square" | "video" | "banner"
  placeholder?: string
  maxSize?: number // in MB
}

export function ImageUpload({
  value,
  onChange,
  folder = "media",
  className,
  aspectRatio = "square",
  placeholder = "Upload an image",
  maxSize = 10,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
  }[aspectRatio]

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Use JPG, PNG, GIF, WebP, or SVG.")
        return
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File too large. Maximum size: ${maxSize}MB`)
        return
      }

      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Upload failed")
        }

        onChange(data.url)
      } catch (err) {
        console.error("Upload error:", err)
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setIsUploading(false)
      }
    },
    [folder, maxSize, onChange]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0])
      }
    },
    [handleUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0])
      }
    },
    [handleUpload]
  )

  const handleRemove = useCallback(() => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [onChange])

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="sr-only"
        id={`image-upload-${folder}`}
      />

      {value ? (
        // Preview
        <div className={cn("relative overflow-hidden bg-white/5 border border-white/10", aspectRatioClass)}>
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-sola-black/80 hover:bg-sola-red/80 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Upload zone
        <label
          htmlFor={`image-upload-${folder}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer",
            "bg-white/5 border-2 border-dashed border-white/20 hover:border-sola-gold/50 transition-colors",
            dragActive && "border-sola-gold bg-sola-gold/5",
            isUploading && "pointer-events-none opacity-50",
            aspectRatioClass
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-sola-gold animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-white/40 mb-2" />
              <span className="text-sm text-white/60">{placeholder}</span>
              <span className="text-xs text-white/40 mt-1">
                Max {maxSize}MB • JPG, PNG, GIF, WebP
              </span>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="text-xs text-sola-red mt-2">{error}</p>
      )}
    </div>
  )
}
