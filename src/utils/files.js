export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function createObjectUrl(file) {
  return URL.createObjectURL(file);
}

export function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  queueMicrotask(() => URL.revokeObjectURL(url));
}

export async function copyText(content) {
  await navigator.clipboard.writeText(content);
}
