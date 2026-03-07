// Client-side image resizing using Canvas API

interface ResizeConfig {
  key: string;
  width: number;
  height: number | null; // null = maintain aspect ratio
  quality: number;
}

const RESIZE_CONFIGS: ResizeConfig[] = [
  { key: 'sns_instagram', width: 1080, height: 1080, quality: 0.9 },
  { key: 'sns_x', width: 1200, height: 675, quality: 0.9 },
  { key: 'sns_facebook', width: 1200, height: 630, quality: 0.9 },
  { key: 'navi_card', width: 400, height: 400, quality: 0.85 },
  { key: 'navi_detail', width: 800, height: null, quality: 0.85 },
  { key: 'navi_thumb', width: 120, height: 120, quality: 0.8 },
];

function resizeImage(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number | null,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    let w = targetWidth;
    let h = targetHeight || Math.round((img.height / img.width) * targetWidth);

    canvas.width = w;
    canvas.height = h;

    // For square/fixed crops, center-crop the image
    if (targetHeight !== null) {
      const scale = Math.max(w / img.width, h / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (w - scaledW) / 2;
      const offsetY = (h - scaledH) / 2;
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
    }

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function processImageFile(file: File): Promise<FormData> {
  const img = await loadImage(file);
  const formData = new FormData();

  // Original
  formData.append('original', file);

  // Generate all variants
  for (const config of RESIZE_CONFIGS) {
    const blob = await resizeImage(img, config.width, config.height, config.quality);
    const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    formData.append(config.key, resizedFile);
  }

  return formData;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
