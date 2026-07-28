"use client"

import { useRef, useState } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  urls: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export function ImageUploader({ urls, onChange, max = 4 }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = max - urls.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploading(true)
    try {
      const results = await Promise.all(
        toUpload.map(async (file) => {
          const fd = new FormData()
          fd.append("file", file)
          const res = await fetch("/api/upload", { method: "POST", body: fd })
          if (!res.ok) {
            const d = await res.json()
            throw new Error(d.error ?? "Erro no upload")
          }
          return (await res.json()).url as string
        })
      )
      onChange([...urls, ...results])
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar imagem")
    } finally {
      setUploading(false)
    }
  }

  function remove(url: string) {
    onChange(urls.filter(u => u !== url))
  }

  return (
    <div className="space-y-2">
      {urls.length > 0 && (
        <div className={`grid gap-2 ${urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {urls.map(url => (
            <div key={url} className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ImagePlus className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Adicionar imagem"}
            {max > 1 && <span className="text-xs">({urls.length}/{max})</span>}
          </button>
        </>
      )}
    </div>
  )
}
