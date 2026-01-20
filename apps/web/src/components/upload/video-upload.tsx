"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Loader2, Video, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoUploadProps {
  value?: string // Mux playback ID
  assetId?: string // Mux asset ID
  onUploadStart?: (uploadId: string) => void
  onUploadComplete?: (assetId: string) => void
  onRemove?: () => void
  className?: string
  maxSize?: number // in GB
}

type UploadStatus = "idle" | "getting-url" | "uploading" | "processing" | "ready" | "error"

export function VideoUpload({
  value,
  assetId,
  onUploadStart,
  onUploadComplete,
  onRemove,
  className,
  maxSize = 5,
}: VideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>(value ? "ready" : "idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null)
      setProgress(0)

      // Validate file type
      const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Use MP4, WebM, MOV, AVI, or MKV.")
        return
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024 * 1024) {
        setError(`File too large. Maximum size: ${maxSize}GB`)
        return
      }

      try {
        // Step 1: Get upload URL from Mux
        setStatus("getting-url")
        const response = await fetch("/api/upload/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrivate: false }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to get upload URL")
        }

        onUploadStart?.(data.uploadId)

        // Step 2: Upload directly to Mux
        setStatus("uploading")

        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setStatus("processing")
            // Video is now processing on Mux side
            // We'll get a webhook when it's ready
          } else {
            setStatus("error")
            setError("Upload failed")
          }
        })

        xhr.addEventListener("error", () => {
          setStatus("error")
          setError("Upload failed")
        })

        xhr.open("PUT", data.uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      } catch (err) {
        console.error("Video upload error:", err)
        setStatus("error")
        setError(err instanceof Error ? err.message : "Upload failed")
      }
    },
    [maxSize, onUploadStart]
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

  const handleCancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    setStatus("idle")
    setProgress(0)
    setError(null)
  }, [])

  const handleRemove = useCallback(() => {
    handleCancel()
    onRemove?.()
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [handleCancel, onRemove])

  const renderContent = () => {
    switch (status) {
      case "ready":
        return (
          <div className="relative aspect-video bg-sola-black/50 border border-white/10">
            {value && (
              <img
                src={`https://image.mux.com/${value}/thumbnail.jpg?time=0`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-sola-black/50">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-sola-black/80 hover:bg-sola-red/80 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )

      case "processing":
        return (
          <div className="aspect-video flex flex-col items-center justify-center bg-white/5 border border-white/10">
            <Loader2 className="h-8 w-8 text-sola-gold animate-spin mb-2" />
            <span className="text-sm text-white/60">Processing video...</span>
            <span className="text-xs text-white/40 mt-1">This may take a few minutes</span>
          </div>
        )

      case "uploading":
        return (
          <div className="aspect-video flex flex-col items-center justify-center bg-white/5 border border-white/10">
            <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-sola-gold transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-white/60">Uploading... {progress}%</span>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 text-xs text-white/40 hover:text-sola-red transition-colors"
            >
              Cancel
            </button>
          </div>
        )

      case "getting-url":
        return (
          <div className="aspect-video flex flex-col items-center justify-center bg-white/5 border border-white/10">
            <Loader2 className="h-8 w-8 text-sola-gold animate-spin" />
            <span className="text-sm text-white/60 mt-2">Preparing upload...</span>
          </div>
        )

      case "error":
        return (
          <div className="aspect-video flex flex-col items-center justify-center bg-sola-red/5 border border-sola-red/20">
            <AlertCircle className="h-8 w-8 text-sola-red mb-2" />
            <span className="text-sm text-sola-red">{error}</span>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-3 text-xs text-white/60 hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        )

      default:
        return (
          <label
            htmlFor="video-upload"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "aspect-video flex flex-col items-center justify-center cursor-pointer",
              "bg-white/5 border-2 border-dashed border-white/20 hover:border-sola-gold/50 transition-colors",
              dragActive && "border-sola-gold bg-sola-gold/5"
            )}
          >
            <Video className="h-10 w-10 text-white/40 mb-2" />
            <span className="text-sm text-white/60">Upload a video</span>
            <span className="text-xs text-white/40 mt-1">
              Max {maxSize}GB • MP4, WebM, MOV
            </span>
          </label>
        )
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
        onChange={handleFileSelect}
        className="sr-only"
        id="video-upload"
        disabled={status !== "idle"}
      />
      {renderContent()}
    </div>
  )
}
