import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Props {
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
  folder?: string;
  label?: string;
}

const ACCEPT = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaUploader({ value, onChange, kind, folder = "media", label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const dataUrl = await fileToBase64(file);
      const res = await fetch(func2url["upload-media"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: dataUrl, contentType: file.type, folder }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить файл");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Ошибка загрузки. Попробуйте ещё раз");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <label className="text-xs text-white/50 mb-1.5 block">{label}</label>}

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 mb-2">
          {kind === "image" ? (
            <img src={value} alt="" className="w-full h-32 object-cover" />
          ) : (
            <video src={value} className="w-full h-32 object-cover" muted />
          )}
          <button
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-ink/80 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors"
            title="Удалить"
          >
            <Icon name="X" size={13} />
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 shrink-0 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white transition-colors disabled:opacity-50"
          title={kind === "image" ? "Загрузить картинку" : "Загрузить видео"}
        >
          {uploading ? (
            <Icon name="Loader2" size={15} className="animate-spin" />
          ) : (
            <Icon name="Upload" size={15} />
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
