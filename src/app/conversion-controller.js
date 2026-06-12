import { baseName, detectFormat } from '../domain/formats.js';
import { downloadText, readTextFile } from '../utils/files.js';

export class ConversionController {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.service = dependencies.service;
    this.panels = dependencies.panels;
    this.player = dependencies.player;
    this.status = dependencies.status;
    this.controls = dependencies.controls;
    this.loadedFileName = dependencies.loadedFileName;
  }

  async loadLyricsFile(file) {
    const text = await readTextFile(file);
    this.state.lyricsFile = file;
    this.state.lyricsText = text;
    this.state.inputFormat = this.resolveFormat(file.name, text);
    this.state.baseFilename = baseName(file.name);
    this.loadedFileName.textContent = file.name;
    await this.rebuild();
  }

  downloadManualExport() {
    if (!this.state.hasLyrics()) return;
    const options = this.currentOptions();
    const target = this.controls.exportFormat.value;
    const exportOptions = this.exportOptionsForTarget(target);
    const output = this.service.convert(this.state.lyricsText, { ...options, ...exportOptions });
    downloadText(`${this.state.baseFilename}.${exportOptions.extension}`, output);
  }

  exportOptionsForTarget(target) {
    if (target === 'lrc_phrase') return { to: 'lrc', lrcStyle: 'phrase', extension: 'lrc' };
    if (target === 'lrc_word') return { to: 'lrc', lrcStyle: 'apple-word', extension: 'lrc' };
    if (target === 'vtt') return { to: 'vtt', extension: 'vtt' };
    if (target === 'ttml') return { to: 'ttml', extension: 'ttml' };
    if (target === 'json') return { to: 'json', extension: 'json' };
    if (target === 'txt') return { to: 'txt', extension: 'txt' };
    return { to: 'srt', extension: 'srt' };
  }

  async rebuild() {
    if (!this.state.hasLyrics()) return;
    const options = this.currentOptions();
    try {
      const plain = this.service.convert(this.state.lyricsText, { ...options, to: 'txt' });
      const phrase = this.service.convert(this.state.lyricsText, { ...options, to: 'lrc', lrcStyle: 'phrase' });
      const word = this.service.convert(this.state.lyricsText, { ...options, to: 'lrc', lrcStyle: 'apple-word' });
      const srt = this.service.convert(this.state.lyricsText, { ...options, to: 'srt' });

      this.state.outputs = { plain, phrase, word, srt };
      this.panels.setOutput('plain', plain, `plain-${this.state.baseFilename}.txt`);
      this.panels.setOutput('phrase', phrase, `phrase-${this.state.baseFilename}.lrc`);
      this.panels.setOutput('word', word, `word-${this.state.baseFilename}.lrc`);
      this.player.load(this.state.lyricsText, options);
      this.controls.downloadExportButton.disabled = false;
      this.status.ok(`Parsed ${this.state.inputFormat.toUpperCase()} and exported TXT, phrase LRC, Apple LRC, and SRT internally.`);
    } catch (error) {
      this.status.error(error);
    }
  }

  currentOptions() {
    return {
      from: this.state.inputFormat,
      granularity: this.controls.granularity.value,
      offsetMs: Number(this.controls.offset.value || 0)
    };
  }

  resolveFormat(fileName, text) {
    const selected = this.controls.inputFormat.value;
    return selected === 'auto' ? detectFormat(fileName, text) : selected;
  }
}
