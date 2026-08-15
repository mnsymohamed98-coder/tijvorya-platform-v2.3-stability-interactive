export type UploadResourceType = "image" | "video";

export async function uploadMedia(file: File, resourceType: UploadResourceType, folder: string) {
  const signResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType, folder }),
  });
  if (!signResponse.ok) {
    const payload = await signResponse.json().catch(() => ({}));
    throw new Error(payload.error ?? "Cloudinary is not configured");
  }
  const signed = await signResponse.json() as { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);
  body.append("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`, { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? "Upload failed");
  return { url: String(result.secure_url), publicId: String(result.public_id), bytes: Number(result.bytes ?? file.size) };
}
