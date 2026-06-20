import { browser } from '$app/environment';
import { Capacitor, registerPlugin } from '@capacitor/core';

type VelaExportPlugin = {
  shareFile(options: { filename: string; contents: string; mimeType: string }): Promise<void>;
};

const VelaExport = registerPlugin<VelaExportPlugin>('VelaExport');

export function safeExportFilename(filename: string) {
  const clean = filename.replace(/[\\/:*?"<>|]/g, '_').trim();
  return clean || 'vela-export.txt';
}

export async function exportFile(filename: string, contents: string, mimeType: string) {
  const safeFilename = safeExportFilename(filename);

  if (browser && Capacitor.isNativePlatform()) {
    await VelaExport.shareFile({ filename: safeFilename, contents, mimeType });
    return;
  }

  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFilename;
  anchor.click();
  URL.revokeObjectURL(url);
}
