"use client";

import { FileVideo2, ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadMedia, type UploadResourceType } from "@/lib/cloudinary/upload";
import { useApp } from "@/providers/app-provider";
import { storeLocalMedia } from "@/lib/media-store";
import { PersistentImage, PersistentVideo } from "@/components/ui/persistent-media";

export function MediaUploader({
  resourceType,
  folder,
  value,
  onChange,
  maxMB = 20,
  label,
}: {
  resourceType: UploadResourceType;
  folder: "tijvorya/products" | "tijvorya/reels" | "tijvorya/stores";
  value?: string;
  onChange: (url: string) => void;
  maxMB?: number;
  label: string;
}) {
  const { locale, productionMode, toast } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progressText, setProgressText] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) { toast(locale === "ar" ? `الحد الأقصى ${maxMB}MB` : `Maximum size is ${maxMB}MB`, "error"); return; }
    if (resourceType === "video" && !file.type.startsWith("video/")) { toast(locale === "ar" ? "اختر ملف فيديو صالحًا" : "Choose a valid video file", "error"); return; }
    if (resourceType === "image" && !file.type.startsWith("image/")) { toast(locale === "ar" ? "اختر صورة صالحة" : "Choose a valid image", "error"); return; }

    setUploading(true); setProgressText(locale === "ar" ? "جارٍ تجهيز الملف…" : "Preparing file…");
    try {
      if (productionMode || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        setProgressText(locale === "ar" ? "جارٍ الرفع إلى التخزين السحابي…" : "Uploading to cloud storage…");
        const result = await uploadMedia(file, resourceType, folder);
        onChange(result.url);
      } else {
        setProgressText(locale === "ar" ? "جارٍ حفظ الملف محليًا…" : "Saving file locally…");
        const localUrl = await storeLocalMedia(file);
        onChange(localUrl);
        toast(locale === "ar" ? "تم حفظ الملف محليًا وسيظهر في لوحة الإدارة" : "File saved locally and will appear in admin moderation", "info");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : (locale === "ar" ? "فشل رفع الملف" : "Upload failed"), "error");
    } finally { setUploading(false); setProgressText(""); }
  }

  return <div className="media-uploader">
    <div className="field-label-row"><label>{label}</label><small>{resourceType === "video" ? `MP4/WebM · ${maxMB}MB` : `JPG/PNG/WebP · ${maxMB}MB`}</small></div>
    {value ? <div className={`media-preview ${resourceType}`}>
      {resourceType === "video" ? <PersistentVideo src={value} controls preload="metadata" /> : <PersistentImage src={value} alt={label} />}
      <button type="button" className="media-remove" onClick={() => onChange("")} aria-label={locale === "ar" ? "إزالة الملف" : "Remove file"}><X /></button>
    </div> : <button
      type="button"
      className={`upload-dropzone ${dragging ? "is-dragging" : ""}`}
      onClick={() => input.current?.click()}
      onDragOver={(event) => { event.preventDefault(); if (!uploading) setDragging(true); }}
      onDragEnter={(event) => { event.preventDefault(); if (!uploading) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); if (!uploading) void handleFile(event.dataTransfer.files?.[0]); }}
      disabled={uploading}
    >
      {uploading ? <LoaderCircle className="spin" /> : resourceType === "video" ? <FileVideo2 /> : <ImagePlus />}
      <strong>{uploading ? progressText : dragging ? (locale === "ar" ? "أفلت الملف للرفع" : "Drop to upload") : (locale === "ar" ? "اختر ملفًا من الجهاز" : "Choose a file from your device")}</strong>
      <span>{locale === "ar" ? "اضغط للتصفح أو اسحب الملف هنا" : "Click to browse or drag the file here"}</span>
      {!uploading && <UploadCloud />}
    </button>}
    <input ref={input} type="file" hidden accept={resourceType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif"} onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
  </div>;
}
