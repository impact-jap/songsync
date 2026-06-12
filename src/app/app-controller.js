import { AppState } from './app-state.js';
import { ConversionController } from './conversion-controller.js';
import { SyncLyricsService } from '../backend/synclyrics-service.js';
import { AudioLoader } from '../player/audio-loader.js';
import { LyricsPlayer } from '../player/lyrics-player.js';
import { DropZone } from '../ui/drop-zone.js';
import { PanelsView } from '../ui/panels-view.js';
import { StatusView } from '../ui/status-view.js';
import { SynchronizedScroll } from '../ui/synchronized-scroll.js';
import { $, $all, setHidden } from '../utils/dom.js';
import { selectors } from '../config/selectors.js';

export class AppController {
  constructor() {
    this.state = new AppState();
    this.service = new SyncLyricsService();
    this.elements = this.collectElements();
    this.status = new StatusView(this.elements.status);
    this.panels = new PanelsView(this.elements.outputs, this.elements.buttons);
    this.audioLoader = new AudioLoader(this.elements.audio);
    this.player = new LyricsPlayer({
      audio: this.elements.audio,
      stage: this.elements.karaokeStage,
      canvas: this.elements.karaokeCanvas,
      summary: this.elements.runtimeSummary
    }, this.service);
    this.conversion = new ConversionController({
      state: this.state,
      service: this.service,
      panels: this.panels,
      player: this.player,
      status: this.status,
      controls: this.elements.controls,
      loadedFileName: this.elements.loadedFileName
    });
  }

  async boot() {
    this.bindUi();
    this.status.info('Loading SyncLyrics WASM backend.');
    await this.service.init();
    this.status.ok('WASM backend ready. Drop an LRC, SRT, WebVTT, TTML, TXT, or JSON file.');
  }

  collectElements() {
    return {
      root: $(selectors.root),
      panels: $all(selectors.panels),
      outputs: {
        plain: $(selectors.panelOutputs.plain),
        phrase: $(selectors.panelOutputs.phrase),
        word: $(selectors.panelOutputs.word)
      },
      buttons: {
        downloads: $all(selectors.downloads),
        copies: $all(selectors.copies)
      },
      loadAudioButton: $(selectors.loadAudioButton),
      loadLyricsButton: $(selectors.loadLyricsButton),
      togglePlayerButton: $(selectors.togglePlayerButton),
      toggleSettingsButton: $(selectors.toggleSettingsButton),
      audioInput: $(selectors.audioInput),
      lyricsInput: $(selectors.lyricsInput),
      audio: $(selectors.audio),
      downloadExportButton: $(selectors.downloadExportButton),
      settingsSheet: $(selectors.settingsSheet),
      karaokeDock: $(selectors.karaokeDock),
      karaokeStage: $(selectors.karaokeStage),
      karaokeCanvas: $(selectors.karaokeCanvas),
      loadedFileName: $(selectors.loadedFileName),
      runtimeSummary: $(selectors.runtimeSummary),
      status: $(selectors.status),
      controls: {
        inputFormat: $(selectors.inputFormat),
        offset: $(selectors.offset),
        exportFormat: $(selectors.exportFormat),
        downloadExportButton: $(selectors.downloadExportButton),
        granularity: $(selectors.granularity),
        inverseHighlight: $(selectors.inverseHighlight)
      }
    };
  }

  bindUi() {
    this.panels.bindActions();
    new SynchronizedScroll(Object.values(this.elements.outputs)).bind();
    new DropZone(this.elements.root, files => this.handleDroppedFiles(files)).bind();

    this.elements.loadAudioButton.addEventListener('click', () => this.elements.audioInput.click());
    this.elements.loadLyricsButton.addEventListener('click', () => this.elements.lyricsInput.click());
    this.elements.togglePlayerButton.addEventListener('click', () => setHidden(this.elements.karaokeDock, !this.elements.karaokeDock.hidden));
    this.elements.toggleSettingsButton.addEventListener('click', () => setHidden(this.elements.settingsSheet, !this.elements.settingsSheet.hidden));
    this.elements.downloadExportButton.addEventListener('click', () => this.conversion.downloadManualExport());

    this.elements.audioInput.addEventListener('change', event => this.handleAudioFile(event.target.files?.[0]));
    this.elements.lyricsInput.addEventListener('change', event => this.handleLyricsFile(event.target.files?.[0]));

    for (const control of Object.values(this.elements.controls)) {
      if (control) control.addEventListener('change', () => this.conversion.rebuild());
    }

    this.elements.controls.inverseHighlight.addEventListener('change', () => {
      this.elements.karaokeStage.dataset.inverse = String(this.elements.controls.inverseHighlight.checked);
    });
  }

  handleDroppedFiles(files) {
    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        this.handleAudioFile(file);
      } else {
        this.handleLyricsFile(file);
      }
    }
  }

  handleAudioFile(file) {
    if (!file) return;
    this.audioLoader.load(file);
  }

  async handleLyricsFile(file) {
    if (!file) return;
    await this.conversion.loadLyricsFile(file);
    setHidden(this.elements.karaokeDock, false);
  }
}
