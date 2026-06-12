import { DomLyricsRenderer } from './dom-lyrics-renderer.js';
import { CanvasLyricsRenderer } from './canvas-lyrics-renderer.js';

const FRAME_INTERVAL_MS = 16;

export class LyricsPlayer {
  constructor(elements, service) {
    this.audio = elements.audio;
    this.stage = elements.stage;
    this.canvas = elements.canvas;
    this.summary = elements.summary;
    this.service = service;
    this.runtime = null;
    this.currentOptions = {};
    this.animationFrame = 0;
    this.lastPaintTime = 0;
    this.domRenderer = new DomLyricsRenderer(this.stage, {
      onNodeClick: nodeId => this.seekToNode(nodeId),
      visibleRadius: 1
    });
    this.canvasRenderer = new CanvasLyricsRenderer(this.canvas);
  }

  load(input, options) {
    this.stop();
    this.currentOptions = { ...options };
    this.runtime = this.service.createRuntime(input, options);
    this.domRenderer.render(this.runtime.nodes, this.currentOptions);
    this.canvasRenderer.render(this.runtime.nodes);
    this.summary.textContent = `${this.runtime.nodes.length} render nodes`;
    this.start();
  }

  start() {
    this.stop();

    const tick = timestamp => {
      if (this.runtime && timestamp - this.lastPaintTime >= FRAME_INTERVAL_MS) {
        const timeMs = this.audio.currentTime * 1000;
        const state = this.runtime.stateAt(timeMs);
        this.domRenderer.update(state);
        this.canvasRenderer.update(state);
        this.lastPaintTime = timestamp;
      }

      this.animationFrame = requestAnimationFrame(tick);
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.animationFrame = 0;
    this.lastPaintTime = 0;
  }

  seekToNode(nodeId) {
    if (!this.runtime) return;

    const timeMs = this.runtime.seekTimeForNode(nodeId);
    if (Number.isFinite(timeMs)) {
      this.audio.currentTime = timeMs / 1000;
      this.audio.play().catch(() => {});
    }
  }
}
