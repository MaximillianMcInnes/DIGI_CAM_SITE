export async function resizeImage(file: File, maxWidth: number, quality = 0.82): Promise<Blob | null> {
  if (!file.type.startsWith("image/") || file.type.includes("heic")) return null;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

export async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/") || file.type.includes("heic")) return {};
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return {};
  return { width: bitmap.width, height: bitmap.height };
}
