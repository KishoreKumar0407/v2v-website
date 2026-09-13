/**
 * Converts an uploaded File to an optimized, resized base64 Data URL using HTML5 Canvas.
 * This prevents massive image payloads, memory overhead, and upload failures.
 */
export const processImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const srcData = String(e.target?.result || '');
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(srcData);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for high compression, fallback to JPEG/PNG Data URL
          const compressed = canvas.toDataURL('image/webp', quality);
          if (compressed && compressed.startsWith('data:image/webp')) {
            return resolve(compressed);
          }
          const jpegData = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegData || srcData);
        } catch (err) {
          resolve(srcData);
        }
      };

      img.onerror = () => resolve(srcData);
      img.src = srcData;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
