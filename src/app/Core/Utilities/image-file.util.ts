export async function optimizeAvatar(file: File): Promise<File> {
  const supported = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!supported.has(file.type.toLowerCase())) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sourceX = Math.round((bitmap.width - side) / 2);
    const sourceY = Math.round((bitmap.height - side) / 2);
    const outputSize = Math.min(256, side);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      side,
      side,
      0,
      0,
      outputSize,
      outputSize,
    );
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', 0.78),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, '')}.webp`,
      { type: 'image/webp', lastModified: Date.now() },
    );
  } catch {
    return file;
  }
}
