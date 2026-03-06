"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type UploadType = "image" | "raw" | "invoice";

type CloudinaryUploadButtonProps = {
  type?: UploadType;
  accept?: string;
  onUploadBegin?: () => void;
  onUploadComplete?: (result: { url: string; publicId: string }) => void;
  onUploadError?: (error: Error) => void;
  label?: string;
  uploadingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function CloudinaryUploadButton({
  type = "image",
  accept = "image/*",
  onUploadBegin,
  onUploadComplete,
  onUploadError,
  label = "Upload",
  uploadingLabel = "Uploading...",
  className,
  disabled = false,
}: CloudinaryUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    if (!uploading && !disabled) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    onUploadBegin?.();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploadComplete?.({ url: data.url, publicId: data.publicId });
    } catch (err) {
      onUploadError?.(err instanceof Error ? err : new Error("Upload failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading || disabled}
        className={cn(
          "rounded-2xl bg-brand/75 px-4 py-2 text-sm font-semibold text-white transition-all duration-500 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        {uploading ? uploadingLabel : label}
      </button>
    </>
  );
}
