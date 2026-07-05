/**
 * WHY: Image processing inside the browser (like creating Image instances
 * and reading DataURLs) is separated here to keep business logic clean 
 * and avoid polluting components with DOM API specifics.
 */

export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: estimate based on file size if dimensions can't be read
      // Typical images: ~100KB for 512x512, ~400KB for 1024x1024
      // Rough estimate: assume square image, estimate dimensions from size
      const estimatedSize = Math.sqrt((file.size / 1024) * 100); // rough approximation
      resolve({ width: estimatedSize, height: estimatedSize });
    };

    img.src = url;
  });
};

export const getImageDimensionsFromDataURL = (
  dataUrl: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      // If we can't read dimensions from the data URL, fall back to 0x0
      resolve({ width: 0, height: 0 });
    };

    img.src = dataUrl;
  });
};
