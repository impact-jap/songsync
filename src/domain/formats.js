const EXTENSION_TO_FORMAT = new Map([
  ['lrc', 'lrc'],
  ['srt', 'srt'],
  ['vtt', 'vtt'],
  ['webvtt', 'vtt'],
  ['ttml', 'ttml'],
  ['xml', 'ttml'],
  ['txt', 'txt'],
  ['json', 'json']
]);

export function detectFormat(fileName, text) {
  const extension = String(fileName || '').split('.').pop()?.toLowerCase();
  if (extension && EXTENSION_TO_FORMAT.has(extension)) {
    return EXTENSION_TO_FORMAT.get(extension);
  }

  const value = String(text || '').trimStart();
  if (value.startsWith('WEBVTT')) return 'vtt';
  if (/^\d+\s+\d{2}:\d{2}:\d{2},\d{3}\s+-->/.test(value)) return 'srt';
  if (value.startsWith('{') || value.startsWith('[')) return 'json';
  if (/<tt[\s>]/i.test(value)) return 'ttml';
  if (/^\[\d{2}:\d{2}[\.:]\d{2,3}\]/m.test(value)) return 'lrc';
  return 'txt';
}

export function baseName(fileName) {
  return String(fileName || 'lyrics').replace(/\.[^/.]+$/, '') || 'lyrics';
}
