import { createObjectUrl } from '../utils/files.js';

export class AudioLoader {
  constructor(audioElement) {
    this.audioElement = audioElement;
    this.currentUrl = null;
  }

  load(file) {
    if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
    this.currentUrl = createObjectUrl(file);
    this.audioElement.src = this.currentUrl;
    this.audioElement.classList.add('is-visible');
    document.title = file.name;
  }
}
