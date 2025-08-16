export function downloadFile(url: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function createBlobUrl(blob: Blob): string {
  return window.URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string): void {
  window.URL.revokeObjectURL(url);
}

export function generateTailoredFileName(originalName: string): string {
  return originalName.replace(".docx", "_tailored.docx");
}
