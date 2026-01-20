"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Film, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"
import { getVideoUploadUrl } from "@/app/actions/course"

type Props = {
  lessonId: string
  onUploadComplete?: () => void
  currentPlaybackId?: string | null
}

type UploadState = "idle" | "getting_url" | "uploading" | "processing" | "complete" | "error"

export function VideoUploader({ lessonId, onUploadComplete, currentPlaybackId }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>(
    currentPlaybackId ? "complete" : "idle"
  )
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Check file size (max 5GB for Mux)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      setError("File size must be less than 5GB")
      return
    }

    setError(null)
    setUploadState("getting_url")

    // Get upload URL from server
    const result = await getVideoUploadUrl(lessonId)

    if (result.error || !result.uploadUrl) {
      setError(result.error || "Failed to get upload URL")
      setUploadState("error")
      return
    }

    setUploadState("uploading")
    setProgress(0)

    try {
      // Upload using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            setProgress(percent)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })

        xhr.open("PUT", result.uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      setUploadState("processing")

      // The Mux webhook will update the lesson once processing is complete
      // For now, show processing state
      setTimeout(() => {
        setUploadState("complete")
        onUploadComplete?.()
      }, 2000)

    } catch (err) {
      console.error("Upload error:", err)
      setError("Upload failed. Please try again.")
      setUploadState("error")
    }
  }, [lessonId, onUploadComplete])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }, [handleUpload])

  const resetUpload = useCallback(() => {
    setUploadState("idle")
    setProgress(0)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  if (uploadState === "complete" && currentPlaybackId) {
    return (
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-white font-display uppercase tracking-wide">
            Video Uploaded
          </span>
        </div>
        <div className="aspect-video bg-black/50 rounded overflow-hidden">
          <video
            src={`https://stream.mux.com/${currentPlaybackId}.m3u8`}
            controls
            className="w-full h-full"
            poster={`https://image.mux.com/${currentPlaybackId}/thumbnail.jpg`}
          />
        </div>
        <button
          onClick={resetUpload}
          className="mt-4 text-sm text-white/60 hover:text-white transition-colors"
        >
          Upload different video
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-sola-gold bg-sola-gold/10"
            : uploadState === "error"
            ? "border-sola-red/50 bg-sola-red/5"
            : "border-white/20 hover:border-white/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={uploadState !== "idle" && uploadState !== "error"}
        />

        <div className="p-12 text-center">
          {uploadState === "idle" && (
            <>
              <div className="w-16 h-16 bg-white/5 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-white font-display uppercase tracking-wide mb-2">
                Upload Video
              </p>
              <p className="text-white/50 text-sm">
                Drag and drop a video file, or click to browse
              </p>
              <p className="text-white/30 text-xs mt-2">
                MP4, MOV, or WebM up to 5GB
              </p>
            </>
          )}

          {uploadState === "getting_url" && (
            <>
              <Loader2 className="h-12 w-12 text-sola-gold mx-auto mb-4 animate-spin" />
              <p className="text-white font-display uppercase tracking-wide">
                Preparing upload...
              </p>
            </>
          )}

          {uploadState === "uploading" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#D4A84B"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={176}
                    strokeDashoffset={176 - (176 * progress) / 100}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-display">
                  {progress}%
                </span>
              </div>
              <p className="text-white font-display uppercase tracking-wide">
                Uploading...
              </p>
              <div className="w-full max-w-xs mx-auto mt-4 h-2 bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-sola-gold transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}

          {uploadState === "processing" && (
            <>
              <Film className="h-12 w-12 text-sola-gold mx-auto mb-4 animate-pulse" />
              <p className="text-white font-display uppercase tracking-wide">
                Processing video...
              </p>
              <p className="text-white/50 text-sm mt-2">
                This may take a few minutes
              </p>
            </>
          )}

          {uploadState === "complete" && !currentPlaybackId && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-white font-display uppercase tracking-wide">
                Upload Complete
              </p>
              <p className="text-white/50 text-sm mt-2">
                Video is being processed by Mux
              </p>
            </>
          )}

          {uploadState === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-sola-red mx-auto mb-4" />
              <p className="text-white font-display uppercase tracking-wide">
                Upload Failed
              </p>
              <p className="text-sola-red text-sm mt-2">{error}</p>
              <button
                onClick={resetUpload}
                className="mt-4 inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
