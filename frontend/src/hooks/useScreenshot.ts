import { useCallback } from 'react';

export const useScreenshot = () => {
  const takeScreenshot = useCallback((videoElement: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!videoElement) {
        reject(new Error('Video element not found'));
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create screenshot'));
        }
      }, 'image/png');
    });
  }, []);
  
  const downloadScreenshot = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);
  
  return { takeScreenshot, downloadScreenshot };
};