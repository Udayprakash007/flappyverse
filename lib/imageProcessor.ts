// Client-side Image Processor for FlappyVerse
// Handles reliable resizing, compression, orientation, and background removal

export async function processImageFile(
  file: File,
  maxDimension: number = 600,
  quality: number = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please upload a valid image file (PNG, JPG, JPEG, WebP)."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read the selected image."));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image for processing."));
      img.onload = () => {
        // Calculate proportional scale
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve(src); // Fallback to raw dataUrl
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export clean transparent PNG if original had alpha, or JPEG
        const hasAlpha = file.type === "image/png" || file.type === "image/webp";
        const outputMime = hasAlpha ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(outputMime, quality);
        resolve(dataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// Magic Chroma / Background Color Remover
// Turns pixels close to the sample color into transparent pixels
export async function removeColorBackground(
  imageUrl: string,
  targetRGB: { r: number; g: number; b: number },
  tolerance: number = 35
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("Failed to load image for background removal."));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageUrl);

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in RGB color space
        const diff = Math.sqrt(
          Math.pow(r - targetRGB.r, 2) +
          Math.pow(g - targetRGB.g, 2) +
          Math.pow(b - targetRGB.b, 2)
        );

        if (diff < tolerance) {
          // Soft edge alpha falloff
          if (diff < tolerance * 0.7) {
            data[i + 3] = 0; // Completely transparent
          } else {
            const factor = (diff - tolerance * 0.7) / (tolerance * 0.3);
            data[i + 3] = Math.round(data[i + 3] * factor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  });
}

