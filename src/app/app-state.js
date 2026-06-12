export class AppState {
  constructor() {
    this.lyricsFile = null;
    this.lyricsText = '';
    this.inputFormat = 'lrc';
    this.baseFilename = 'lyrics';
    this.outputs = {
      plain: '',
      phrase: '',
      word: ''
    };
    this.runtime = null;
  }

  hasLyrics() {
    return this.lyricsText.trim().length > 0;
  }
}
